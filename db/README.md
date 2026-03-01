# Database

MySQL setup, SQL scripts, and migrations.

## Layout

- **`scripts/`** – SQL and docs (create DB). Run `npm run db:create` to create the app DB if missing.
- **`migrations/`** – TypeORM migrations. Run `npm run migration:run` to apply.

## Quick start

1. **Create the database** (if it doesn’t exist):

   ```bash
   npm run db:create
   ```

2. **Run migrations**:

   ```bash
   npm run migration:run
   ```

The app will also create the database on startup when `SKIP_DB` is not `true`.

## Scripts (package.json)

| Script               | Description                    |
|----------------------|--------------------------------|
| `npm run db:create`  | Create DB from `.env` if missing (MySQL: CREATE DATABASE IF NOT EXISTS) |
| `npm run migration:run`    | Apply pending migrations       |
| `npm run migration:revert`  | Revert last migration         |
| `npm run migration:generate -- db/migrations/Name` | Generate migration from entity changes |
| `npm run migration:create -- db/migrations/Name`   | Create empty migration        |

## Data source

TypeORM CLI uses `db/data-source.ts` (loads `.env`). Keep its settings in sync with `AppModule` (host, port, user, password, database). Use MySQL connection (port 3306).
