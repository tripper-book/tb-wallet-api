# Migrations

TypeORM migrations live here. They run in order by timestamp in the filename.

## Commands

```bash
# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes (after you add entities)
npm run migration:generate -- db/migrations/YourMigrationName
```

## Adding a new migration

1. **Create manually** (for raw SQL or custom changes):

   ```bash
   npm run migration:create -- db/migrations/AddUsersTable
   ```

   Then edit the new file under `db/migrations/` and implement `up()` and `down()`.

2. **Generate from entities** (after changing entity files):

   ```bash
   npm run migration:generate -- db/migrations/YourMigrationName
   ```

   Ensure `DB_*` in `.env` points to your database and that the app’s TypeORM config uses the same `db/data-source` settings.

## Migration files

- Use the pattern: `{timestamp}-{Name}.ts` (e.g. `1730200000001-InitialSchema.ts`).
- Implement `MigrationInterface`: `up(queryRunner)` and `down(queryRunner)`.
- Prefer `queryRunner.query()` for SQL so it works with the migration runner.
