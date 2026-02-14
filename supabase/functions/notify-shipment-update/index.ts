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

        // C. Notify Agent (Confirmation) - The one who performed the action
        if (scannedBy) {
            const { data: actorProfile } = await supabase.from("profiles").select("email, full_name").eq("id", scannedBy).single();
            if (actorProfile?.email) {
                emailsToSend.push({
                    from: `WACC System <${SENDER_EMAIL}>`,
                    to: [actorProfile.email],
                    subject: `Action Confirmed: ${trackingId} Updated`,
                    html: `
            <p>Hello ${actorProfile.full_name || 'Agent'},</p>
            <p>You successfully updated shipment <strong>${trackingId}</strong> to <strong>${statusHuman}</strong>.</p>
            <p><strong>Location:</strong> ${location || "N/A"}</p>
            <p>Thank you for your hard work.</p>
          `,
                });
            }
        }

        // D. Notify Next Agents (Handoff)
        // Logic: Status X -> Notify Agents with Role Y
        const nextRoleMap: Record<string, string> = {
            'picked_up': 'in_transit',       // Valid next step: In Transit
            'in_transit': 'customs',         // Valid next step: Customs
            'customs': 'out_for_delivery',   // Valid next step: Out for Delivery
            'out_for_delivery': 'delivery',  // Valid next step: Delivery
            // 'delivered': null             // End of chain
        };

        const nextRole = nextRoleMap[status];

        if (nextRole) {
            // Find agents with this role
            const { data: nextAgents } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('designated_status', nextRole)
                .eq('role', 'agent');

            if (nextAgents && nextAgents.length > 0) {
                const nextAgentIds = nextAgents.map(a => a.user_id);
                const { data: nextProfiles } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .in('id', nextAgentIds);

                if (nextProfiles) {
                    nextProfiles.forEach(profile => {
                        if (profile.email) {
                            emailsToSend.push({
                                from: `WACC Logistics <${SENDER_EMAIL}>`,
                                to: [profile.email],
                                subject: `New Task: Shipment ${trackingId} Ready`,
                                html: `
                  <p>Hello ${profile.full_name || 'Agent'},</p>
                  <p>A shipment is ready for your action.</p>
                  <p><strong>Tracking ID:</strong> ${trackingId}</p>
                  <p><strong>Current Status:</strong> ${statusHuman}</p>
                  <p><strong>Location:</strong> ${location || "N/A"}</p>
                  <p>Please proceed with the next step (${nextRole.replace(/_/g, ' ').toUpperCase()}).</p>
                `,
                            });
                        }
                    });
                }
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
