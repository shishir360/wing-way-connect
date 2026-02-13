// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ULTRAMSG_INSTANCE_ID = Deno.env.get("ULTRAMSG_INSTANCE_ID");
const ULTRAMSG_TOKEN = Deno.env.get("ULTRAMSG_TOKEN");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: string;
  record: any;
  old_record?: any;
  metadata?: any;
}

const styles = `
  .container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb; }
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
  .content { padding: 40px; color: #334155; line-height: 1.6; }
  .content h2 { color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 600; }
  .info-card { background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #f1f5f9; }
  .info-item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
  .info-item:last-child { margin-bottom: 0; }
  .info-label { color: #64748b; font-weight: 500; }
  .info-value { color: #0f172a; font-weight: 600; }
  .status-badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #e0f2fe; color: #0369a1; }
  .button { display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 24px; transition: background-color 0.2s; }
  .footer { padding: 32px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9; }
  .footer p { margin: 0; color: #94a3b8; font-size: 12px; }
  .footer a { color: #0ea5e9; text-decoration: none; font-weight: 500; }
`;

const emailHandler = async (payload: NotificationPayload, adminEmails: string[]) => {
  const { type, record, old_record } = payload;
  let emailsToSend: { to: string; subject: string; html: string }[] = [];

  if (type === 'flight_booking') {
    const booking = record;
    const userEmail = booking.email;
    const fullName = booking.full_name;

    // Email to User
    emailsToSend.push({
      to: userEmail,
      subject: "Your Flight Booking is Confirmed - Wing Way Connect",
      html: `
        <html>
          <head><style>${styles}</style></head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Wing Way Connect</h1>
              </div>
              <div class="content">
                <h2>Flight Booking Confirmation</h2>
                <p>Hello ${fullName},</p>
                <p>Great news! Your flight booking has been successfully received. Our team is currently processing your request and will reach out with the final confirmation shortly.</p>
                <div class="info-card">
                  <div class="info-item"><span class="info-label">Reference</span><span class="info-value">${booking.booking_reference || booking.id.slice(0, 8)}</span></div>
                  <div class="info-item"><span class="info-label">Route</span><span class="info-value">${booking.departure_city} → ${booking.arrival_city}</span></div>
                  <div class="info-item"><span class="info-label">Departure Date</span><span class="info-value">${booking.departure_date}</span></div>
                  <div class="info-item"><span class="info-label">Passengers</span><span class="info-value">${booking.passengers}</span></div>
                </div>
                <p>If you have any questions, please reply to this email or visit our website.</p>
                <a href="${SUPABASE_URL}" class="button">View Booking Details</a>
              </div>
              <div class="footer">
                <p>© 2024 Wing Way Connect. All rights reserved.</p>
                <p><a href="https://wcargo2024.com">wcargo2024.com</a> | Travel with confidence</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    // Email to Admins
    adminEmails.forEach(adminEmail => {
      emailsToSend.push({
        to: adminEmail,
        subject: "Action Required: New Flight Booking",
        html: `
          <html>
            <head><style>${styles}</style></head>
            <body>
              <div class="container">
                <div class="header" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                  <h1>New Booking Alert</h1>
                </div>
                <div class="content">
                  <h2>New Flight Booking Received</h2>
                  <p>A new booking has been placed on the platform. Please review and manage the request in the admin dashboard.</p>
                  <div class="info-card">
                    <div class="info-item"><span class="info-label">Customer</span><span class="info-value">${fullName}</span></div>
                    <div class="info-item"><span class="info-label">Email</span><span class="info-value">${userEmail}</span></div>
                    <div class="info-item"><span class="info-label">Phone</span><span class="info-value">${booking.phone}</span></div>
                    <div class="info-item"><span class="info-label">Route</span><span class="info-value">${booking.departure_city} → ${booking.arrival_city}</span></div>
                  </div>
                  <a href="${SUPABASE_URL}" class="button">Go to Admin Dashboard</a>
                </div>
                <div class="footer">
                  <p>Internal Notification | Wing Way Connect</p>
                </div>
              </div>
            </body>
          </html>
        `
      });
    });
  }

  if (type === 'agent_approved') {
    const { email, fullName } = record;
    emailsToSend.push({
      to: email,
      subject: "Agent Application Approved - Wing Way Connect",
      html: `
        <html>
          <head><style>${styles}</style></head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);">
                <h1>Application Approved</h1>
              </div>
              <div class="content">
                <h2>Welcome to the Team, ${fullName}!</h2>
                <p>We are pleased to inform you that your application to become a Wing Way Connect agent has been approved.</p>
                <div class="info-card">
                  <div class="info-item"><span class="info-label">Account Status</span><span class="status-badge" style="background-color: #dcfce7; color: #166534;">Active</span></div>
                  <div class="info-item"><span class="info-label">Role</span><span class="info-value">Agent</span></div>
                </div>
                <p>You now have access to the agent dashboard where you can manage shipments and track deliveries.</p>
                <a href="https://wcargo2024.com/agent-login" class="button" style="background-color: #16a34a;">Login to Agent Dashboard</a>
              </div>
              <div class="footer">
                <p>© 2026 Wing Way Connect. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });
  }

  if (type === 'shipment_update' || type === 'shipment_created') {
    const shipment = record;
    const userEmail = shipment.sender_email || shipment.receiver_email;
    const status = shipment.status;

    if (userEmail && (type === 'shipment_created' || status !== old_record?.status)) {
      const isNew = type === 'shipment_created';
      emailsToSend.push({
        to: userEmail,
        subject: isNew ? "Shipment Received - Wing Way Connect" : `Shipment Update: ${status.replace('_', ' ')}`,
        html: `
          <html>
            <head><style>${styles}</style></head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Wing Way Connect</h1>
                </div>
                <div class="content">
                  <h2>${isNew ? 'Shipment Received' : 'Package Status Update'}</h2>
                  <p>Hello ${shipment.sender_name || ''},</p>
                  <p>${isNew ? 'Your shipment has been successfully created and is ready for processing.' : 'Your shipment status has been updated. You can find the latest information below:'}</p>
                  <div class="info-card" style="text-align: center;">
                    <span class="info-label" style="display: block; margin-bottom: 8px;">Current Status</span>
                    <span class="status-badge">${status.replace('_', ' ')}</span>
                  </div>
                  <div class="info-card">
                    <div class="info-item"><span class="info-label">Tracking ID</span><span class="info-value">${shipment.tracking_id || shipment.id.slice(0, 8)}</span></div>
                    <div class="info-item"><span class="info-label">Route</span><span class="info-value">${shipment.from_city || ''} → ${shipment.to_city || ''}</span></div>
                    <div class="info-item"><span class="info-label">Last Updated</span><span class="info-value">${new Date().toLocaleString()}</span></div>
                  </div>
                  <p>Track your package live on our website for real-time updates.</p>
                  <a href="https://wcargo2024.com/track-shipment" class="button">Track My Shipment</a>
                </div>
                <div class="footer">
                  <p>© 2024 Wing Way Connect. All rights reserved.</p>
                  <p><a href="https://wcargo2024.com">wcargo2024.com</a></p>
                </div>
              </div>
            </body>
          </html>
        `
      });

      if (isNew) {
        // Notify Admins of new Shipment/Cargo booking
        adminEmails.forEach(adminEmail => {
          emailsToSend.push({
            to: adminEmail,
            subject: "New Shipment Booking Alert",
            html: `
              <html>
                <head><style>${styles}</style></head>
                <body>
                  <div class="container">
                    <div class="header" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                      <h1>New Shipment Alert</h1>
                    </div>
                    <div class="content">
                      <h2>New Shipment Created</h2>
                      <p>A new cargo shipment has been booked. Please review the details in the admin panel.</p>
                      <div class="info-card">
                        <div class="info-item"><span class="info-label">Sender</span><span class="info-value">${shipment.sender_name}</span></div>
                        <div class="info-item"><span class="info-label">ID</span><span class="info-value">${shipment.tracking_id}</span></div>
                        <div class="info-item"><span class="info-label">Route</span><span class="info-value">${shipment.from_city} → ${shipment.to_city}</span></div>
                      </div>
                      <a href="${SUPABASE_URL}" class="button">View in Admin Panel</a>
                    </div>
                  </div>
                </body>
              </html>
            `
          });
        });
      }
    }
  }

  if (emailsToSend.length === 0 || !RESEND_API_KEY) return { success: true, skipped: !RESEND_API_KEY };

  const results = await Promise.all(emailsToSend.map(async (email) => {
    try {
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
      return await res.json();
    } catch (err: any) {
      console.error(`Email delivery failed to ${email.to}: ${err.message}`);
      return { error: err.message };
    }
  }));

  return { channel: 'email', results };
};

const whatsappHandler = async (payload: NotificationPayload, adminPhone: string) => {
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    return { channel: 'whatsapp', skipped: true, reason: 'Missing UltraMsg config' };
  }

  const { type, record } = payload;
  let messages: { to: string; body: string }[] = [];

  if (type === 'flight_booking') {
    const booking = record;
    messages.push({
      to: adminPhone,
      body: `🔔 *New Flight Booking Alert*\n\nName: ${booking.full_name}\nRoute: ${booking.departure_city} to ${booking.arrival_city}\nDate: ${booking.departure_date}\nPhone: ${booking.phone}\n\nCheck admin panel for details.`
    });
  }

  if (type === 'shipment_update' || type === 'shipment_created') {
    const shipment = record;
    const userPhone = shipment.sender_phone || shipment.receiver_phone;
    if (userPhone) {
      if (type === 'shipment_created') {
        messages.push({
          to: userPhone,
          body: `📦 *Shipment Confirmed*\n\nTracking ID: ${shipment.tracking_id}\nRoute: ${shipment.from_city} to ${shipment.to_city}\nStatus: ${shipment.status.toUpperCase()}\n\nTrack here: https://wcargo2024.com/track-shipment`
        });
        messages.push({
          to: adminPhone,
          body: `🚀 *New Shipment Notification*\n\nID: ${shipment.tracking_id}\nSender: ${shipment.sender_name}\nRoute: ${shipment.from_city} to ${shipment.to_city}\n\nPlease update status in admin dashboard.`
        });
      } else {
        messages.push({
          to: userPhone,
          body: `📦 *Shipment Update*\n\nTracking ID: ${shipment.tracking_id}\nStatus: ${shipment.status.replace('_', ' ').toUpperCase()}\n\nTrack here: https://wcargo2024.com/track-shipment`
        });
      }
    }
  }

  if (messages.length === 0) return { success: true, skipped: true };

  const results = await Promise.all(messages.map(async (msg) => {
    try {
      const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ULTRAMSG_TOKEN,
          to: msg.to.startsWith('+') ? msg.to.substring(1) : msg.to,
          body: msg.body,
          priority: 10
        }),
      });
      return await res.json();
    } catch (err: any) {
      console.error(`WhatsApp delivery failed to ${msg.to}: ${err.message}`);
      return { error: err.message };
    }
  }));

  return { channel: 'whatsapp', results };
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    console.log(`Processing ${payload.type} notification...`);

    // Fetch Admin Details
    const { data: adminSettings } = await supabase
      .from('site_settings')
      .select('value')
      .in('key', ['admin_emails', 'admin_phone']);

    let adminEmails = ['shishirmd542@gmail.com', 'shishirmd681@gmail.com'];
    let adminPhone = '8801700000000'; // Replace with default or fetch

    adminSettings?.forEach((s: any) => {
      if (s.key === 'admin_emails') adminEmails = s.value.split(',').map((e: string) => e.trim());
      if (s.key === 'admin_phone') adminPhone = s.value;
    });

    // Execute Handlers
    const [emailRes, waRes] = await Promise.all([
      emailHandler(payload, adminEmails),
      whatsappHandler(payload, adminPhone)
    ]);

    return new Response(JSON.stringify({ success: true, emailRes, waRes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`Fatal error in notification service: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
