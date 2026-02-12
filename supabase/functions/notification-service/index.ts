import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    console.log(`Notification received for type: ${type}`);

    let emailsToSend: { to: string; subject: string; html: string }[] = [];

    // Fetch Admin Emails
    const { data: adminSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_emails')
      .single();

    let adminEmails = ['shishirmd542@gmail.com', 'shishirmd681@gmail.com']; // Fallback
    if (adminSettings?.value) {
      adminEmails = adminSettings.value.split(',').map((e: string) => e.trim());
    }

    if (type === 'flight_booking') {
      // Flight Booking Logic
      const booking = record;
      const userEmail = booking.email;
      const fullName = booking.full_name;

      // Email to User
      emailsToSend.push({
        to: userEmail,
        subject: "Flight Booking Confirmation - Wing Way Connect",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #0ea5e9;">Booking Confirmation</h2>
            <p>Dear ${fullName},</p>
            <p>Thank you for choosing Wing Way Connect! Your flight booking has been received and is being processed.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Route:</strong> ${booking.departure_city} to ${booking.arrival_city}</p>
              <p><strong>Date:</strong> ${booking.departure_date}</p>
              <p><strong>Passengers:</strong> ${booking.passengers}</p>
            </div>
            <p>Our team will contact you shortly with further details.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b;">Official Website: <a href="https://wcargo2024.com">wcargo2024.com</a></p>
          </div>
        `
      });

      // Email to Admins
      adminEmails.forEach(adminEmail => {
        emailsToSend.push({
          to: adminEmail,
          subject: "New Flight Booking Alert!",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #ef4444;">New Booking Received</h2>
              <p>A new flight booking has been made on wcargo2024.com</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Customer:</strong> ${fullName} (${userEmail})</p>
                <p><strong>Phone:</strong> ${booking.phone}</p>
                <p><strong>Route:</strong> ${booking.departure_city} to ${booking.arrival_city}</p>
              </div>
              <a href="${SUPABASE_URL}" style="display: inline-block; background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
            </div>
          `
        });
      });
    }

    if (type === 'shipment_update') {
      // Shipment Update Logic
      const shipment = record;
      const userEmail = shipment.sender_email || shipment.receiver_email;
      const status = shipment.status;

      if (userEmail && status !== old_record?.status) {
        emailsToSend.push({
          to: userEmail,
          subject: `Shipment Update: ${status} - Wing Way Connect`,
          html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #0ea5e9;">Package Update</h2>
                <p>Your shipment (ID: ${shipment.tracking_number || shipment.id}) has a new status:</p>
                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: #020617; text-transform: uppercase;">${status}</span>
                </div>
                <p>You can track your package live at <a href="https://wcargo2024.com/track-shipment">wcargo2024.com/track-shipment</a></p>
              </div>
            `
        });
      }
    }

    // Send Emails via Resend
    const results = await Promise.all(emailsToSend.map(async (email) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Wing Way Connect <code@wcargo2024.com>",
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }),
      });
      return res.json();
    }));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Error in notification service: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
