import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAddressesTable1737456100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'addressId',
            type: 'uuid',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'fullName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'addressLine1',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'addressLine2',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'postalCode',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'country',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'isDefault',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'addressType',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'addresses',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on userId for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_addresses_userId" ON "addresses" ("userId");
    `);

    // Create index on addressId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_addresses_addressId" ON "addresses" ("addressId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('addresses');
  }
}

