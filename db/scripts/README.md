# DB scripts

SQL and helpers for database setup. All schema is applied via TypeORM migrations; these scripts are for reference or manual runs.

## Scripts

| File | Purpose |
|------|--------|
| `01_check_database_exists.sql` | Check if a database exists (MySQL). |
| `02_create_database.sql` | Create the app database (MySQL: CREATE DATABASE IF NOT EXISTS). |
| `03_initial_schema.sql` | Reference schema (same as migration; apply via `npm run migration:run`). |

## Creating the database

Use the app script so the database is created only if it doesn’t exist:

```bash
npm run db:create
```

This connects to the MySQL server and runs `CREATE DATABASE IF NOT EXISTS \`DB_NAME\`` (from `.env`). The same logic runs on app startup when `SKIP_DB` is not `true`.

## Running SQL manually

With `.env` loaded:

```bash
export $(grep -v '^#' .env | xargs)
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
```

Then run a script:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < db/scripts/03_initial_schema.sql
```

Replace placeholders in the SQL with your `DB_NAME` when running by hand.
