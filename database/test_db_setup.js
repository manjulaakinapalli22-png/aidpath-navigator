/**
 * Database Migration and Verification Helper
 * Verifies Supabase connection and tests schema availability.
 */

import { config } from '../server/config/env.js';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testConnection() {
  console.log('================================================================');
  console.log('📡 Supabase Database Verification Helper');
  console.log('================================================================\n');

  if (!config.supabaseUrl || (!config.supabaseServiceKey && !config.supabaseKey)) {
    console.log('⚠️  SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
    console.log('    are not yet configured in .env.\n');
    console.log('ℹ️  The application runs seamlessly in Integrated Resilient Mode');
    console.log('    using the pre-seeded synthetic data store.\n');
    console.log('📋 To connect to your live Supabase PostgreSQL database:');
    console.log('    1. Create a project at https://supabase.com');
    console.log('    2. Copy your Project URL & Service Role / Anon Key into .env');
    console.log('    3. Run database/migrations/01_schema.sql in Supabase SQL Editor');
    console.log('    4. Run database/seeds/01_seed_scholarships.sql in Supabase SQL Editor\n');
    return;
  }

  console.log(`Connecting to ${config.supabaseUrl}...`);
  const client = createClient(config.supabaseUrl, config.supabaseServiceKey || config.supabaseKey);

  try {
    const { data, error } = await client.from('scholarships').select('id, title, award_amount').limit(3);
    if (error) {
      console.error('❌ Error querying scholarships table:', error.message);
      console.log('\nMake sure you have executed database/migrations/01_schema.sql in your Supabase SQL Editor.');
    } else {
      console.log('✅ Supabase PostgreSQL connected successfully!');
      console.log(`Found ${data.length} sample records in cloud database.`);
    }
  } catch (err) {
    console.error('❌ Connection exception:', err.message);
  }
}

testConnection();
