import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  customs: "At Customs",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shipmentId, newStatus, trackingId } = await req.json();

    if (!shipmentId || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing shipmentId or newStatus" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch shipment details
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return new Response(
        JSON.stringify({ error: "Shipment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for RESEND_API_KEY
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(
        JSON.stringify({ message: "Email skipped - no RESEND_API_KEY configured", shipmentId, newStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const emailTo = shipment.sender_email;
    if (!emailTo) {
      return new Response(
        JSON.stringify({ message: "No sender email found, skipping notification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const statusLabel = statusLabels[newStatus] || newStatus;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "WACC Shipping <noreply@updates.wacc.com>",
        to: [emailTo],
        subject: `Shipment ${trackingId || shipment.tracking_id} - ${statusLabel}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a2744; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">WACC Shipping Update</h1>
            </div>
            <div style="padding: 32px; background: #f9fafb;">
              <h2 style="color: #1a2744;">Shipment Status Updated</h2>
              <p>Hello ${shipment.sender_name},</p>
              <p>Your shipment <strong>${shipment.tracking_id}</strong> status has been updated to:</p>
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 16px 0; text-align: center; border: 1px solid #e5e7eb;">
                <p style="font-size: 24px; font-weight: bold; color: #1a2744; margin: 0;">${statusLabel}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <tr><td style="padding: 8px 0; color: #6b7280;">Route</td><td style="padding: 8px 0; font-weight: 600;">${shipment.route === 'bd-to-ca' ? 'Bangladesh → Canada' : 'Canada → Bangladesh'}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Receiver</td><td style="padding: 8px 0; font-weight: 600;">${shipment.receiver_name}</td></tr>
                <tr><td style="padding: 8px 0; color: #6b7280;">Weight</td><td style="padding: 8px 0; font-weight: 600;">${shipment.weight || '-'} kg</td></tr>
              </table>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Thank you for choosing WACC!</p>
            </div>
          </div>
        `,
      }),
    });

    const emailResult = await emailRes.json();

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
