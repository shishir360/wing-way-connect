
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Check scan count
        const { count: scanCount, error: countError } = await supabase
            .from('shipment_scans')
            .select('*', { count: 'exact', head: true });

        // 2. Fetch last 5 scans
        const { data: recentScans, error: scansError } = await supabase
            .from('shipment_scans')
            .select('id, scan_type, location, created_at, scanned_by')
            .order('created_at', { ascending: false })
            .limit(5);

        // 3. specific user check (optional/debugging)
        // const { data: users } = await supabase.from('users').select('id, email').limit(5);

        return new Response(
            JSON.stringify({
                scanCount,
                countError,
                recentScans,
                scansError
            }, null, 2),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

Deno.serve(handler);
