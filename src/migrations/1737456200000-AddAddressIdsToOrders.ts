import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressIdsToOrders1737456200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add shippingAddressId to orders table
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'shippingAddressId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add billingAddressId to orders table
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'billingAddressId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create indexes for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_shippingAddressId" ON "orders" ("shippingAddressId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_billingAddressId" ON "orders" ("billingAddressId");
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

