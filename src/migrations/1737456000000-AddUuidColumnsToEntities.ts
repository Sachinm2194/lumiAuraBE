import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUuidColumnsToEntities1737456000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if userId column exists in users table, if not add it
    const usersTable = await queryRunner.getTable('users');
    const hasUserIdColumn = usersTable?.findColumnByName('userId');
    
    if (!hasUserIdColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
          isUnique: true,
        }),
      );

      // Generate UUIDs for existing user records
      await queryRunner.query(`
        UPDATE users 
        SET "userId" = gen_random_uuid() 
        WHERE "userId" IS NULL;
      `);

      // Create index on userId for faster lookups (if not already exists from unique constraint)
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_users_userId" ON "users" ("userId");
      `);
    }

    // Add categoryId to categories table
    await queryRunner.addColumn(
      'categories',
      new TableColumn({
        name: 'categoryId',
        type: 'uuid',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Add tagId to tags table
    await queryRunner.addColumn(
      'tags',
      new TableColumn({
        name: 'tagId',
        type: 'uuid',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Add reviewId to product_reviews table
    await queryRunner.addColumn(
      'product_reviews',
      new TableColumn({
        name: 'reviewId',
        type: 'uuid',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Generate UUIDs for existing records
    await queryRunner.query(`
      UPDATE categories 
      SET "categoryId" = gen_random_uuid() 
      WHERE "categoryId" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE tags 
      SET "tagId" = gen_random_uuid() 
      WHERE "tagId" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE product_reviews 
      SET "reviewId" = gen_random_uuid() 
      WHERE "reviewId" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove userId from users table (only if it was added by this migration)
    const usersTable = await queryRunner.getTable('users');
    const hasUserIdColumn = usersTable?.findColumnByName('userId');
    if (hasUserIdColumn) {
      await queryRunner.dropColumn('users', 'userId');
    }

    // Remove categoryId from categories table
    await queryRunner.dropColumn('categories', 'categoryId');

    // Remove tagId from tags table
    await queryRunner.dropColumn('tags', 'tagId');

    // Remove reviewId from product_reviews table
    await queryRunner.dropColumn('product_reviews', 'reviewId');
  }
}

