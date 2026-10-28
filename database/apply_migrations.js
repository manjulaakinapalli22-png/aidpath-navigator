import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../server/config/env.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('================================================================');
  console.log('🚀 Connecting directly to Supabase PostgreSQL...');
  console.log('================================================================\n');

  if (!config.databaseUrl) {
    console.error('❌ DATABASE_URL is missing from environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL database!');

    // Read and execute 01_schema.sql
    const schemaPath = path.join(__dirname, 'migrations', '01_schema.sql');
    console.log(`\n⏳ Applying schema migration: ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema migration applied successfully (tables, triggers, RLS policies created)!');

    // Read and execute 01_seed_scholarships.sql
    const seedPath = path.join(__dirname, 'seeds', '01_seed_scholarships.sql');
    console.log(`\n⏳ Applying seed data: ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('✅ Seed data applied successfully!');

    // Verify row counts
    const profRes = await client.query('SELECT COUNT(*) FROM profiles');
    const schRes = await client.query('SELECT COUNT(*) FROM scholarships');
    const reqRes = await client.query('SELECT COUNT(*) FROM scholarship_requirements');
    const docRes = await client.query('SELECT COUNT(*) FROM scholarship_documents');
    const savedRes = await client.query('SELECT COUNT(*) FROM saved_scholarships');
    const chkRes = await client.query('SELECT COUNT(*) FROM application_checklists');

    console.log('\n📊 Live Supabase PostgreSQL Verification:');
    console.log(` - Profiles:                ${profRes.rows[0].count}`);
    console.log(` - Scholarships:            ${schRes.rows[0].count}`);
    console.log(` - Scholarship Requirements:${reqRes.rows[0].count}`);
    console.log(` - Scholarship Documents:   ${docRes.rows[0].count}`);
    console.log(` - Saved Scholarships:      ${savedRes.rows[0].count}`);
    console.log(` - Application Checklists:  ${chkRes.rows[0].count}`);

    console.log('\n🎉 Supabase PostgreSQL is completely initialized and live!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
