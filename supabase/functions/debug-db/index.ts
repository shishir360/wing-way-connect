
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Get a user ID to assign scans to
        const { data: users } = await supabase.from('profiles').select('id').limit(1);
        const userId = users && users.length > 0 ? users[0].id : null;

        if (!userId) {
            return new Response(JSON.stringify({ error: "No users found to assign scans to." }), { status: 400 });
        }

        // 2. Get recent shipments
        const { data: shipments } = await supabase
            .from('shipments')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!shipments || shipments.length === 0) {
            return new Response(JSON.stringify({ error: "No shipments found." }), { status: 400 });
        }

        const scans = [];

        // 3. Insert Checkpoint Scan
        for (const ship of shipments) {
            scans.push({
                shipment_id: ship.id,
                scanned_by: userId,
                scan_type: 'checkpoint',
                location: 'Dhaka Distribution Center',
                notes: 'Package arrived at main distribution hub',
                scanned_at: new Date(Date.now() - Math.random() * 14400000).toISOString() // Random time in last 4 hours
            });
        }

        // 4. Insert Out for Delivery Scan for the second shipment
        if (shipments.length > 1) {
            scans.push({
                shipment_id: shipments[1].id,
                scanned_by: userId,
                scan_type: 'out_for_delivery',
                location: 'Dhaka City',
                notes: 'Out for delivery with rider',
                scanned_at: new Date(Date.now() - 600000).toISOString() // 10 mins ago
            });
        }

        const { data, error } = await supabase.from('shipment_scans').insert(scans).select();

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, inserted: data.length, data }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

Deno.serve(handler);
