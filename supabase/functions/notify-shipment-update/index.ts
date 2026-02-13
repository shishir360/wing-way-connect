/// <reference path="../deno.d.ts" />

import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_EMAIL = "shishirmd681@gmail.com"; // Fallback/Primary Admin
const SENDER_EMAIL = "updates@wcargo2024.com"; // Verified sender

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { shipmentId, status, location, scannedBy, description } = await req.json();

        if (!shipmentId || !status) {
            throw new Error("Missing shipmentId or status");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch Shipment Details
        const { data: shipment, error: sError } = await supabase
            .from("shipments")
            .select("*")
            .eq("id", shipmentId)
            .single();

        if (sError || !shipment) throw new Error("Shipment not found");

        // 2. Fetch Agent Details (if scannedBy provided)
        let agentName = "System";
        if (scannedBy) {
            const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", scannedBy).single();
            if (profile) agentName = profile.full_name || "Agent";
        }

        const trackingId = shipment.tracking_id;
        const senderName = shipment.sender_name || "Valued Customer";
        const senderEmail = shipment.sender_email;
        // const receiverEmail = shipment.receiver_email; // (Not in schema)

        const statusHuman = status.replace(/_/g, " ").toUpperCase();
        const updateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }); // Adjust TZ as needed

        const emailsToSend = [];

        // A. Notify Admin
        emailsToSend.push({
            from: `WACC Updates <${SENDER_EMAIL}>`,
            to: [ADMIN_EMAIL],
            subject: `📦 Update: ${trackingId} is ${statusHuman}`,
            html: `
        <h2>Shipment Update</h2>
        <p><strong>Tracking ID:</strong> ${trackingId}</p>
        <p><strong>Status:</strong> ${statusHuman}</p>
        <p><strong>Location:</strong> ${location || "N/A"}</p>
        <p><strong>Updated By:</strong> ${agentName}</p>
        <p><strong>Time:</strong> ${updateTime}</p>
        <br/>
        <a href="https://wcargo2024.com/admin/shipments?search=${trackingId}">View in Admin Panel</a>
      `,
        });

        // B. Notify Sender (User) if email exists
        if (senderEmail) {
            emailsToSend.push({
                from: `WACC Logistics <${SENDER_EMAIL}>`,
                to: [senderEmail],
                subject: `Shipment Update: ${trackingId}`,
                html: `
          <h3>Hello ${senderName},</h3>
          <p>Your shipment <strong>${trackingId}</strong> has a new status update.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${statusHuman}</span></p>
            <p><strong>Location:</strong> ${location || "In Transit"}</p>
            <p><strong>Latest Update:</strong> ${description || "Status updated"}</p>
          </div>
          <p>Track your shipment live: <a href="https://wcargo2024.com/track-shipment?id=${trackingId}">Click Here</a></p>
          <br/>
          <p>Thank you for choosing WACC.</p>
        `,
            });
        }

        // C. Notify Agent (Confirmation) - Optional, maybe skip to reduce spam
        // But user asked for "current agent". 
        // If 'scannedBy' is the agent, maybe they don't need email? 
        // But "assigned_agent" might be different?
        // Let's email the *Assigned* Agent if exists.
        if (shipment.assigned_agent && shipment.assigned_agent !== scannedBy) {
            const { data: assignedProfile } = await supabase.from("profiles").select("email").eq("id", shipment.assigned_agent).single();
            if (assignedProfile?.email) {
                emailsToSend.push({
                    from: `WACC System <${SENDER_EMAIL}>`,
                    to: [assignedProfile.email],
                    subject: `Shipment Update: ${trackingId}`,
                    html: `
            <p>Shipment <strong>${trackingId}</strong> assigned to you was updated by ${agentName}.</p>
            <p><strong>New Status:</strong> ${statusHuman}</p>
            <p><strong>Location:</strong> ${location || "N/A"}</p>
          `,
                });
            }
        }

        // SEND EMAILS
        // We send them in parallel
        const results = await Promise.allSettled(
            emailsToSend.map(email =>
                fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify(email),
                })
            )
        );

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
};

Deno.serve(handler);
