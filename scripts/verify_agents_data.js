
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser to avoid heavy dependencies if possible, 
// but we can try to import dotenv if available. 
// For robustness, I'll parse .env manually since I know the format.

const envPath = path.resolve(__dirname, '../.env');
let envConfig = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            let val = values.join('=').trim();
            // Remove quotes if present
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            envConfig[key.trim()] = val;
        }
    });
} catch (e) {
    console.warn("Could not read .env file:", e.message);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || envConfig.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyAgentsData() {
    console.log("Verifying Agent Data...");

    // 1. Fetch User Roles for agents
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
    // .eq('role', 'agent'); // Commented out to see all roles

    if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return;
    }

    console.log(`Found ${roles.length} total roles.`);
    console.log(roles);

    if (roles.length === 0) return;

    const userIds = roles.map(r => r.user_id);

    // 2. Fetch Profiles to check Phone
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', userIds);

    if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
    }

    console.log("\n--- Agent Data Verification ---");
    profiles.forEach(p => {
        const role = roles.find(r => r.user_id === p.id);
        console.log(`Agent: ${p.full_name} (${p.email})`);
        console.log(`   Phone: ${p.phone ? p.phone : "MISSING ❌"}`);
        console.log(`   Job Role (designated_status): ${role.designated_status ? role.designated_status : "None"}`);
        console.log("--------------------------------");
    });
}

verifyAgentsData();
