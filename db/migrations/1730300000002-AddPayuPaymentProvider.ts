import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds PayU as a payment provider so orders can use PayU Hosted Checkout
 * when PAYU_* env vars are set and provider_id is omitted or set to this provider.
 */
export class AddPayuPaymentProvider1730300000002 implements MigrationInterface {
  name = 'AddPayuPaymentProvider1730300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`payment_providers\` (\`id\`, \`name\`, \`type\`, \`is_active\`)
      VALUES (UUID(), 'PayU', 'payu', 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`payment_providers\` WHERE \`type\` = 'payu'
    `);
  }
}
