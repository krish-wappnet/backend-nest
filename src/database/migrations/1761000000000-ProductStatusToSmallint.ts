import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductStatusToSmallint1761000000000 implements MigrationInterface {
  name = 'ProductStatusToSmallint1761000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN "status_new" smallint NOT NULL DEFAULT 1',
    );
    await queryRunner.query(
      'UPDATE "products" SET "status_new" = CASE "status" WHEN \'DRAFT\' THEN 1 WHEN \'ACTIVE\' THEN 2 WHEN \'ARCHIVED\' THEN 3 ELSE 1 END',
    );
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "status"');
    await queryRunner.query(
      'ALTER TABLE "products" RENAME COLUMN "status_new" TO "status"',
    );
    await queryRunner.query(
      'DROP TYPE IF EXISTS "public"."products_status_enum"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"public\".\"products_status_enum\" AS ENUM('DRAFT','ACTIVE','ARCHIVED')",
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN "status_old" "public"."products_status_enum" NOT NULL DEFAULT \'DRAFT\'',
    );
    await queryRunner.query(
      "UPDATE \"products\" SET \"status_old\" = CASE \"status\" WHEN 1 THEN 'DRAFT' WHEN 2 THEN 'ACTIVE' WHEN 3 THEN 'ARCHIVED' ELSE 'DRAFT' END",
    );
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "status"');
    await queryRunner.query(
      'ALTER TABLE "products" RENAME COLUMN "status_old" TO "status"',
    );
  }
}
