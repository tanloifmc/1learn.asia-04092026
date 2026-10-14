import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.SUPABASE_DB_URL;
const migrationVersion = "20260921094304";
const migrationName = "p0_assessment_validity_config";
const migrationPath = "supabase/migrations/20260921094304_p0_assessment_validity_config.sql";

if (process.env.ALLOW_DEV_DATABASE_WRITE !== "true") {
  throw new Error("Set ALLOW_DEV_DATABASE_WRITE=true to apply this dev/E2E database migration.");
}

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required to apply the P0 database migration.");
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const assertLockedConfig = (row) => {
  const rules = row?.config?.validity_rules;

  if (
    rules?.straightline_block_threshold !== 8 ||
    Object.hasOwn(rules ?? {}, "max_straightline_streak_allowed")
  ) {
    throw new Error("The remote assessment package does not match the locked P0 validity policy.");
  }
};

try {
  await client.connect();
  const appliedMigration = await client.query(
    `select version
     from supabase_migrations.schema_migrations
     where version = $1`,
    [migrationVersion],
  );

  if (appliedMigration.rowCount > 0) {
    const verification = await client.query(
      `select config
       from public.assessment_versions
       where version_tag = $1`,
      ["2026.1"],
    );
    assertLockedConfig(verification.rows[0]);
    console.log(JSON.stringify({ status: "already_applied_and_verified", migrationVersion }));
  } else {
    const migrationSql = await readFile(migrationPath, "utf8");

    await client.query("begin");
    try {
      const migrationResult = await client.query(migrationSql);

      if (migrationResult.rowCount !== 1) {
        throw new Error(`Expected one assessment package update; received ${migrationResult.rowCount ?? 0}.`);
      }

      const verification = await client.query(
        `select config
         from public.assessment_versions
         where version_tag = $1`,
        ["2026.1"],
      );
      assertLockedConfig(verification.rows[0]);

      await client.query(
        `insert into supabase_migrations.schema_migrations (version, statements, name)
         values ($1, $2::text[], $3)`,
        [migrationVersion, [migrationSql], migrationName],
      );
      await client.query("commit");
      console.log(JSON.stringify({ status: "applied_and_verified", migrationVersion }));
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
