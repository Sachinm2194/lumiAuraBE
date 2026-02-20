import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressIdsToOrders1737456200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const ordersTable = await queryRunner.getTable('orders');
    
    // Add shippingAddressId to orders table if it doesn't exist
    const hasShippingAddressId = ordersTable?.findColumnByName('shippingAddressId');
    if (!hasShippingAddressId) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'shippingAddressId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // Add billingAddressId to orders table if it doesn't exist
    const hasBillingAddressId = ordersTable?.findColumnByName('billingAddressId');
    if (!hasBillingAddressId) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'billingAddressId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    // Create indexes for faster lookups (only if they don't exist)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_shippingAddressId" ON "orders" ("shippingAddressId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_billingAddressId" ON "orders" ("billingAddressId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_shippingAddressId";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_billingAddressId";
    `);

    // Remove columns
    await queryRunner.dropColumn('orders', 'shippingAddressId');
    await queryRunner.dropColumn('orders', 'billingAddressId');
  }
}

