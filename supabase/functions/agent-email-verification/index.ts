/// <reference path="../deno.d.ts" />
// Deno Edge Function - Email Verification
// Deno Edge Function - Email Verification
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
    action: "send" | "verify" | "instant";
    email: string;
    code?: string;
    fullName?: string;
    phone?: string;
    password?: string;
    role: "user" | "agent";
}

const handler = async (req: Request): Promise<Response> => {
    console.log(`[DEBUG] New request: ${req.method}`);

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("[DEBUG] Request Body:", JSON.stringify(body, null, 2));

        const { action, email, code, fullName, phone, password, role } = body as RequestData;

        // Runtime validation for critical fields
        if (!["send", "verify", "instant"].includes(action)) {
            throw new Error(`Invalid action: ${action}`);
        }
        if (role && !["user", "agent"].includes(role)) {
            throw new Error(`Invalid role: ${role}`);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const resendKey = Deno.env.get("RESEND_API_KEY");

        console.log(`[DEBUG] Env Check: URL=${!!supabaseUrl}, Key=${!!supabaseKey}, Resend=${!!resendKey}`);

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase environment variables are missing in Edge Function settings.");
        }

        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        const resend = resendKey ? new Resend(resendKey) : null;

        if (action === "instant") {
            console.log(`[DEBUG] Handling 'instant' signup for ${email}`);

            if (!email || !password || !fullName || !phone || !role) {
                console.error("[DEBUG] Missing fields:", { email: !!email, password: !!password, fullName: !!fullName, phone: !!phone, role: !!role });
                throw new Error("Missing required fields (email, password, fullName, phone, or role).");
            }

            // Create User immediately using Auth Admin API
            console.log("[DEBUG] Calling auth.admin.createUser...");
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    phone: phone,
                    role: role,
                    requested_role: role // Added as fallback per trigger logic
                }
            });

            if (createError) {
                console.error("[DEBUG] auth.admin.createUser error:", createError);

                const errMsg = createError.message.toLowerCase();
                if (errMsg.includes("already registered") || errMsg.includes("email address is already associated")) {
                    throw new Error("This email is already registered. Please login instead.");
                }
                if (errMsg.includes("phone") && errMsg.includes("exists")) {
                    throw new Error("This phone number is already registered.");
                }
                throw new Error(`Auth Error: ${createError.message}`);
            }

            console.log("[DEBUG] User created successfully:", newUser.user?.id);

            return new Response(
                JSON.stringify({ success: true, message: "Account created successfully.", userId: newUser.user?.id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Handle Action: Send
        if (action === "send") {
            console.log(`[DEBUG] Handling 'send' OTP for ${email}`);

            if (!email || !fullName || !phone) {
                throw new Error("Missing required fields (email, fullName, or phone).");
            }

            // Generate 6-digit code
            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[DEBUG] Generated OTP for ${email}: ${generatedCode}`);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

            // Store in DB
            console.log("[DEBUG] Storing OTP in verification_codes table...");

            // Cleanup old codes first to avoid unique constraint error
            await supabaseClient
                .from("verification_codes")
                .delete()
                .eq("email", email)
                .eq("type", "signup");

            const { error: dbError } = await supabaseClient
                .from("verification_codes")
                .insert({
                    email,
                    code: generatedCode,
                    type: "signup",
                    expires_at: expiresAt,
                    metadata: { fullName, phone, role }
                });

            if (dbError) {
                console.error("[DEBUG] DB Insert Error:", dbError);
                throw new Error(`Database Error: ${dbError.message}`);
            }

            // Send Email via Resend
            if (resend) {
                console.log("[DEBUG] Sending email via Resend...");
                const { data: emailData, error: emailError } = await resend.emails.send({
                    from: "WingWay <code@wcargo2024.com>", // Updated domain
                    to: [email],
                    subject: "Your Verification Code - WingWay Connect",
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #1e293b; margin-bottom: 16px;">Verify your identity</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 24px;">Hello ${fullName},</p>
                            <p style="color: #475569; font-size: 16px; line-height: 24px;">Thank you for joining WingWay Connect. Use the following code to complete your registration:</p>
                            <div style="background-color: #f1f5f9; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${generatedCode}</span>
                            </div>
                            <p style="color: #64748b; font-size: 14px; line-height: 21px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                            <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2026 WingWay Connect. All rights reserved.</p>
                        </div>
                    `,
                });

                if (emailError) {
                    console.error("[DEBUG] Resend Error:", emailError);
                    // We don't throw here if the DB part succeeded, but maybe we should if the user can't verify
                    throw new Error(`Email Service Error: ${emailError.message}`);
                }
                console.log("[DEBUG] Email sent successfully:", emailData?.id);
            } else {
                console.warn("[DEBUG] Resend key missing. Email not sent.");
                // For development, we return the code in the response if Resend is missing
                return new Response(
                    JSON.stringify({ success: true, message: "OTP generated (Dev Mode: Resend missing)", dev_code: generatedCode }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ success: true, message: "Verification code sent successfully." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Handle Action: Verify
        if (action === "verify") {
            console.log(`[DEBUG] Handling 'verify' OTP for ${email}`);

            if (!email || !code || !password) {
                throw new Error("Missing required fields (email, code, or password).");
            }

            // 1. Check code in DB
            const { data: verification, error: verifyError } = await supabaseClient
                .from("verification_codes")
                .select("*")
                .eq("email", email)
                .eq("code", code)
                .gt("expires_at", new Date().toISOString())
                .maybeSingle();

            if (verifyError) throw new Error(`Verification lookup failed: ${verifyError.message}`);
            if (!verification) {
                throw new Error("Invalid or expired verification code.");
            }

            // Safe metadata extraction
            const metadata = verification.metadata as { fullName?: string; phone?: string; role?: string } | null;
            const storedName = metadata?.fullName;
            const storedPhone = metadata?.phone;
            const storedRole = metadata?.role;

            // 2. Create User
            console.log(`[DEBUG] Code verified. Creating ${storedRole} user...`);
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: storedName,
                    phone: storedPhone,
                    role: storedRole || role,
                    requested_role: storedRole || role
                }
            });

            if (createError) {
                console.error("[DEBUG] auth.admin.createUser error:", createError);
                throw new Error(`Creation Error: ${createError.message}`);
            }

            // 3. Cleanup: Delete the code
            await supabaseClient.from("verification_codes").delete().eq("id", verification.id);

            // 4. Send Welcome Email
            if (resend) {
                const emailSubject = "Welcome to WingWay Connect!";
                const emailHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #1e293b; margin-bottom: 16px;">Welcome, ${storedName || "User"}!</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 24px;">
                            Your account has been successfully created. 
                            ${(storedRole || role) === 'agent' ? 'Your agent account is currently <strong>pending approval</strong>. You will be notified once an admin reviews your application.' : 'You can now log in and start booking shipments.'}
                        </p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="https://wcargo2024.com/login" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Login</a>
                        </div>
                        <p style="color: #64748b; font-size: 14px; line-height: 21px;">If you have any questions, feel free to reply to this email.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2026 WingWay Connect. All rights reserved.</p>
                    </div>
                `;

                try {
                    await resend.emails.send({
                        from: "WingWay <code@wcargo2024.com>",
                        to: [email],
                        subject: emailSubject,
                        html: emailHtml,
                    });
                    console.log("[DEBUG] Welcome email sent.");
                } catch (emailErr) {
                    console.error("[DEBUG] Failed to send welcome email:", emailErr);
                    // Non-blocking error
                }
            }

            return new Response(
                JSON.stringify({ success: true, message: "Account verified and created successfully.", userId: newUser.user?.id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        throw new Error(`Action '${action}' is not supported or not implemented yet.`);

    } catch (error: any) {
        console.error("[FATAL ERROR] Edge Function Exception:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "An unexpected error occurred",
                stack: error.stack,
            }),
            {
                status: 200, // Return 200 with error data so the frontend can read the body properly
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
};

Deno.serve(handler);

