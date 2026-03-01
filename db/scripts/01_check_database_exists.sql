-- Check if a database exists (MySQL).
-- Returns one row per database matching the name.
-- Used by ensure-database script; the runner uses DB_NAME from .env.

-- Example (replace :dbName with your DB_NAME):
-- SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'tb_wallet';
