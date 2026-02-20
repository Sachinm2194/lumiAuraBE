# Database Migrations

This directory contains TypeORM migration files for database schema changes.

## Migration Files

1. **1737456000000-AddUuidColumnsToEntities.ts**
   - Adds `userId` UUID column to `users` table (if not exists)
   - Adds `categoryId` UUID column to `categories` table
   - Adds `tagId` UUID column to `tags` table
   - Adds `reviewId` UUID column to `product_reviews` table
   - Generates UUIDs for all existing records
   - Creates indexes for faster lookups

2. **1737456100000-CreateAddressesTable.ts**
   - Creates new `addresses` table
   - Sets up foreign key relationship with `users` table
   - Creates indexes for performance

3. **1737456200000-AddAddressIdsToOrders.ts**
   - Adds `shippingAddressId` UUID column to `orders` table
   - Adds `billingAddressId` UUID column to `orders` table
   - Creates indexes for faster lookups

## Running Migrations

### Prerequisites

Make sure your `.env` file has the correct database configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=lumiaura
```

### Commands

**Run all pending migrations:**
```bash
npm run migration:run
```

**Show migration status:**
```bash
npm run migration:show
```

**Revert the last migration:**
```bash
npm run migration:revert
```

## Production Deployment

1. **Before deploying:**
   - Test migrations on a staging database first
   - Backup your production database
   - Review the migration files to understand what changes will be made

2. **During deployment:**
   ```bash
   # Build the project first
   npm run build
   
   # Run migrations
   npm run migration:run
   ```

3. **After deployment:**
   - Verify the migrations were successful
   - Check that all new columns/tables exist
   - Test the application functionality

## Important Notes

- Migrations are **idempotent** - running them multiple times is safe
- The UUID columns are initially nullable to allow existing records to be updated
- The migrations automatically generate UUIDs for existing records
- Always backup your database before running migrations in production

## Troubleshooting

If you encounter issues:

1. **Check database connection:**
   - Verify `.env` file has correct credentials
   - Ensure database server is running

2. **Check migration status:**
   ```bash
   npm run migration:show
   ```

3. **If a migration fails:**
   - Check the error message
   - You may need to manually fix the database state
   - Consider reverting the migration if possible

4. **For production issues:**
   - Check database logs
   - Verify database user has necessary permissions
   - Ensure sufficient disk space

