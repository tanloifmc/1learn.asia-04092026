import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const dbUrl = process.env.DIRECT_URL || process.env.SUPABASE_DB_URL;

async function runMigration() {
  console.log('Connecting to', dbUrl);
  const client = new pg.Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('Connected.');
    
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260828013102_create_student_saved_items_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();
