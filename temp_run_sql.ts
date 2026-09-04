import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL
  });
  await client.connect();

  const sql = `
ALTER TABLE payment_transactions ADD COLUMN transaction_code TEXT UNIQUE;
  `;
  
  try {
    await client.query(sql);
    console.log("SQL executed successfully");
  } catch (err) {
    console.error("Error executing SQL:", err);
  } finally {
    await client.end();
  }
}

run();
