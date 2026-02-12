
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser
const envPath = path.resolve(__dirname, '../.env');
let envConfig = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            let val = values.join('=').trim();
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
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTestUser() {
    const email = `test_agent_${Date.now()}@example.com`;
    const password = 'password123';
    const fullName = `Test Agent ${Date.now()}`;

    console.log(`Creating test user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: 'agent', // This should trigger the handle_new_user function
                phone: '+8801700000000',
                vehicle_type: 'Truck'
            }
        }
    });

    if (error) {
        console.error("Signup Error:", error.message);
        if (error.status === 429) {
            console.error("Rate limit hit! Cannot create user.");
        }
    } else {
        console.log("Signup Successful:", data.user?.id);
        console.log("Please check Admin Panel for new agent request.");
    }
}

createTestUser();
