import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema for MySQL: all tables required by the wallet API.
 */
export class MySQLInitialSchema1730300000001 implements MigrationInterface {
  name = 'MySQLInitialSchema1730300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`health_check_log\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`checked_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`external_id\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NULL,
        \`name\` VARCHAR(255) NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`UQ_users_external_id\` (\`external_id\`)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`payment_providers\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`type\` VARCHAR(50) NOT NULL,
        \`config\` JSON NULL,
        \`is_active\` TINYINT NOT NULL DEFAULT 1,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`wallets\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`user_id\` CHAR(36) NOT NULL,
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'INR',
        \`balance_cents\` BIGINT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`UQ_wallets_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_wallets_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`transactions\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`user_id\` CHAR(36) NOT NULL,
        \`type\` VARCHAR(20) NOT NULL,
        \`amount_cents\` BIGINT NOT NULL,
        \`balance_after_cents\` BIGINT NULL,
        \`reference_type\` VARCHAR(50) NULL,
        \`reference_id\` VARCHAR(255) NULL,
        \`metadata\` JSON NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        KEY \`IDX_transactions_user_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_transactions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`user_id\` CHAR(36) NOT NULL,
        \`provider_id\` CHAR(36) NOT NULL,
        \`amount_cents\` BIGINT NOT NULL,
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'INR',
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending',
        \`psp_order_id\` VARCHAR(255) NULL,
        \`psp_token\` VARCHAR(512) NULL,
        \`redirect_url\` VARCHAR(2048) NULL,
        \`metadata\` JSON NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`FK_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_orders_provider\` FOREIGN KEY (\`provider_id\`) REFERENCES \`payment_providers\` (\`id\`) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      INSERT INTO \`payment_providers\` (\`id\`, \`name\`, \`type\`, \`is_active\`)
      VALUES (UUID(), 'Mock Gateway', 'mock', 1)
    `);

    await queryRunner.query(`
      CREATE TABLE \`credit_requests\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`user_id\` CHAR(36) NOT NULL,
        \`amount_cents\` BIGINT NOT NULL,
        \`currency\` VARCHAR(3) NOT NULL DEFAULT 'INR',
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
        \`notes\` TEXT NULL,
        \`admin_notes\` TEXT NULL,
        \`reviewed_at\` DATETIME(6) NULL,
        \`reviewed_by\` VARCHAR(255) NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        KEY \`IDX_credit_requests_user_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_credit_requests_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE \`credit_request_logs\` (
        \`id\` CHAR(36) NOT NULL PRIMARY KEY,
        \`credit_request_id\` CHAR(36) NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`performed_by\` VARCHAR(255) NOT NULL,
        \`old_status\` VARCHAR(50) NULL,
        \`new_status\` VARCHAR(50) NULL,
        \`notes\` TEXT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        KEY \`IDX_credit_request_logs_request_id\` (\`credit_request_id\`),
        CONSTRAINT \`FK_credit_request_logs_request\` FOREIGN KEY (\`credit_request_id\`) REFERENCES \`credit_requests\` (\`id\`) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`credit_request_logs\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`credit_requests\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`orders\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`transactions\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`wallets\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`payment_providers\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`health_check_log\``);
  }
}
