
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

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

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
    console.log(`Processing request: ${req.method}`);
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { action, email, code, fullName, phone, password, role }: RequestData = await req.json();
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        const type = role === 'agent' ? 'signup_agent' : 'signup_user';
        const emailSubject = role === 'agent' ? "Your Agent Verification Code" : "Your Verification Code";
        const appName = role === 'agent' ? "Wing Way Connect Agent" : "Wing Way Connect";

        if (action === "send") {
            // 1. Generate OTP
            const generatedCode = generateCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // 2. Store in DB
            const { error: dbError } = await supabaseClient
                .from("verification_codes")
                .upsert({
                    email,
                    code: generatedCode,
                    type: type,
                    expires_at: expiresAt.toISOString(),
                    metadata: { fullName, phone, role }
                }, { onConflict: 'email,type' });

            if (dbError) throw dbError;

            // 3. Send Email
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: "WACC Verification <code@wcargo2024.com>",
                to: [email],
                subject: emailSubject,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #1a56db; margin: 0;">${appName}</h1>
                <p style="color: #666; margin-top: 5px;">Verification</p>
              </div>
              
              <div style="text-align: center; padding: 20px 0;">
                <h2 style="color: #333; margin-bottom: 10px;">Verification Code</h2>
                <p style="color: #666; margin-bottom: 20px;">Please use the code below to verify your email address.</p>
                
                <div style="background-color: #f0f4ff; border: 2px dashed #1a56db; padding: 15px; display: inline-block; border-radius: 8px;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a56db;">${generatedCode}</span>
                </div>
                
                <p style="color: #888; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
              </div>
              
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} Wing Way Connect. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
            });

            if (emailError) {
                console.error("Resend Error:", emailError);
                throw new Error(emailError.message || JSON.stringify(emailError));
            }

            return new Response(
                JSON.stringify({ message: "Verification code sent", emailData }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );

        } else if (action === "verify") {
            if (!email || !code || !password) {
                throw new Error("Missing verification details");
            }

            // 1. Verify Code
            const { data: record, error: fetchError } = await supabaseClient
                .from("verification_codes")
                .select("*")
                .eq("email", email)
                .eq("code", code)
                .eq("type", type)
                .single();

            if (fetchError || !record) {
                throw new Error("Invalid or expired verification code.");
            }

            if (new Date(record.expires_at) < new Date()) {
                throw new Error("Verification code has expired.");
            }

            const metadata = record.metadata || {};

            // 2. Create User
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: metadata.fullName,
                    phone: metadata.phone,
                    role: metadata.role
                }
            });

            if (createError) {
                console.error("User Creation Error:", createError);
                if (createError.message.toLowerCase().includes("already registered") ||
                    createError.message.toLowerCase().includes("email address is already associated")) {
                    throw new Error("This email is already registered. Please try logging in instead.");
                }
                throw new Error(createError.message || "Failed to create user account.");
            }

            // 3. Cleanup Code
            await supabaseClient.from("verification_codes").delete().eq("id", record.id);

            return new Response(
                JSON.stringify({ success: true, message: "Account verified and created successfully.", userId: newUser.user.id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );

        } else if (action === "instant") {
            if (!email || !password || !fullName || !phone) {
                throw new Error("Missing details for account creation");
            }

            // Create User immediately
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    phone: phone,
                    role: role
                }
            });

            if (createError) {
                console.error("User Creation Error:", createError);
                if (createError.message.toLowerCase().includes("already registered") ||
                    createError.message.toLowerCase().includes("email address is already associated")) {
                    throw new Error("This email is already registered. Please try logging in instead.");
                }
                throw new Error(createError.message || "Failed to create user account.");
            }

            return new Response(
                JSON.stringify({ success: true, message: "Account created successfully.", userId: newUser.user.id }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        throw new Error("Invalid action");

    } catch (error: any) {
        console.error("Error in Edge Function:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "An unexpected error occurred",
                details: error.details || null
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
};

serve(handler);
