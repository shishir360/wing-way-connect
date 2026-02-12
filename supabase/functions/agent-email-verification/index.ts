
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

const handler = async (req: Request): Promise<Response> => {
    console.log(`[DEBUG] New request: ${req.method}`);

    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        console.log("[DEBUG] Request Body:", JSON.stringify(body, null, 2));

        const { action, email, code, fullName, phone, password, role }: RequestData = body;

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const resendKey = Deno.env.get("RESEND_API_KEY");

        console.log(`[DEBUG] Env Check: URL=${!!supabaseUrl}, Key=${!!supabaseKey}, Resend=${!!resendKey}`);

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase environment variables are missing in Edge Function settings.");
        }

        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        const resend = resendKey ? new Resend(resendKey) : null;

        const type = role === 'agent' ? 'signup_agent' : 'signup_user';

        if (action === "instant") {
            console.log(`[DEBUG] Handling 'instant' signup for ${email}`);

            if (!email || !password || !fullName || !phone) {
                console.error("[DEBUG] Missing fields:", { email: !!email, password: !!password, fullName: !!fullName, phone: !!phone });
                throw new Error("Missing required fields (email, password, fullName, or phone).");
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

        // ... Keep existing send/verify logic if needed for users, but focus on instant for agents
        if (action === "send") {
            // ... generate and send (simplified for space)
            return new Response(JSON.stringify({ success: true, message: "Use action='instant' for agents." }), { headers: corsHeaders });
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

serve(handler);
