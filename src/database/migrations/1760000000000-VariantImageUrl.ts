import { MigrationInterface, QueryRunner } from 'typeorm';

export class VariantImageUrl1760000000000 implements MigrationInterface {
  name = 'VariantImageUrl1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "product_variants" ADD "imageUrl" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "product_variants" DROP COLUMN "imageUrl"',
    );
  }
}
