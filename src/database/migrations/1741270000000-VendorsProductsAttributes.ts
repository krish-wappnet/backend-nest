import { MigrationInterface, QueryRunner } from 'typeorm';

export class VendorsProductsAttributes1741270000000 implements MigrationInterface {
  name = 'VendorsProductsAttributes1741270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      "CREATE TYPE \"public\".\"users_vendorstatus_enum\" AS ENUM('PENDING','APPROVED','REJECTED','SUSPENDED')",
    );

    await queryRunner.query(
      'ALTER TABLE "users" ADD "isVendor" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD "vendorStatus" "public"."users_vendorstatus_enum"',
    );

    await queryRunner.query(
      'CREATE TABLE "vendors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "storeName" character varying(255) NOT NULL, "storeSlug" character varying(255) NOT NULL, "businessEmail" character varying(255) NOT NULL, "phone" character varying(32) NOT NULL, "status" "public"."users_vendorstatus_enum" NOT NULL DEFAULT \'PENDING\', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_vendors_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_vendors_userId" UNIQUE ("userId"), CONSTRAINT "UQ_vendors_storeSlug" UNIQUE ("storeSlug"))',
    );
    await queryRunner.query(
      'ALTER TABLE "vendors" ADD CONSTRAINT "FK_vendors_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      "CREATE TYPE \"public\".\"products_status_enum\" AS ENUM('DRAFT','ACTIVE','ARCHIVED')",
    );
    await queryRunner.query(
      'CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vendorId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "category" character varying(120), "brand" character varying(120), "basePrice" numeric(12,2) NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT \'DRAFT\', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_products_id" PRIMARY KEY ("id"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_products_vendorId" ON "products" ("vendorId")',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD CONSTRAINT "FK_products_vendor" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TYPE "public"."product_variants_status_enum" AS ENUM(\'ACTIVE\',\'ARCHIVED\')',
    );
    await queryRunner.query(
      'CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "sku" character varying(255) NOT NULL, "price" numeric(12,2) NOT NULL, "status" "public"."product_variants_status_enum" NOT NULL DEFAULT \'ACTIVE\', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_product_variants_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_product_variants_product_sku" UNIQUE ("productId","sku"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_product_variants_productId" ON "product_variants" ("productId")',
    );
    await queryRunner.query(
      'ALTER TABLE "product_variants" ADD CONSTRAINT "FK_product_variants_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TABLE "inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variantId" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT 0, "reservedQuantity" integer NOT NULL DEFAULT 0, "warehouseLocation" character varying(255), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_inventory_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_inventory_variantId" UNIQUE ("variantId"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_inventory_variantId" ON "inventory" ("variantId")',
    );
    await queryRunner.query(
      'ALTER TABLE "inventory" ADD CONSTRAINT "FK_inventory_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TABLE "attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_attributes_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_attributes_name" UNIQUE ("name"))',
    );

    await queryRunner.query(
      'CREATE TABLE "attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attributeId" uuid NOT NULL, "value" character varying(120) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_attribute_values_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_attribute_values_attribute_value" UNIQUE ("attributeId","value"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_attribute_values_attributeId" ON "attribute_values" ("attributeId")',
    );
    await queryRunner.query(
      'ALTER TABLE "attribute_values" ADD CONSTRAINT "FK_attribute_values_attribute" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TABLE "product_attributes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productId" uuid NOT NULL, "attributeId" uuid NOT NULL, CONSTRAINT "PK_product_attributes_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_product_attributes_product_attribute" UNIQUE ("productId","attributeId"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_product_attributes_productId" ON "product_attributes" ("productId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_product_attributes_attributeId" ON "product_attributes" ("attributeId")',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_attribute" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TABLE "product_attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "productAttributeId" uuid NOT NULL, "attributeValueId" uuid NOT NULL, CONSTRAINT "PK_product_attribute_values_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_product_attribute_values_pa_av" UNIQUE ("productAttributeId","attributeValueId"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_product_attribute_values_productAttributeId" ON "product_attribute_values" ("productAttributeId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_product_attribute_values_attributeValueId" ON "product_attribute_values" ("attributeValueId")',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_pa" FOREIGN KEY ("productAttributeId") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attribute_values" ADD CONSTRAINT "FK_product_attribute_values_av" FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
    );

    await queryRunner.query(
      'CREATE TABLE "variant_attribute_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "variantId" uuid NOT NULL, "attributeValueId" uuid NOT NULL, CONSTRAINT "PK_variant_attribute_values_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_variant_attribute_values_variant_av" UNIQUE ("variantId","attributeValueId"))',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_variant_attribute_values_variantId" ON "variant_attribute_values" ("variantId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_variant_attribute_values_attributeValueId" ON "variant_attribute_values" ("attributeValueId")',
    );
    await queryRunner.query(
      'ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "FK_variant_attribute_values_variant" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "FK_variant_attribute_values_av" FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "variant_attribute_values" DROP CONSTRAINT "FK_variant_attribute_values_av"',
    );
    await queryRunner.query(
      'ALTER TABLE "variant_attribute_values" DROP CONSTRAINT "FK_variant_attribute_values_variant"',
    );
    await queryRunner.query('DROP TABLE "variant_attribute_values"');

    await queryRunner.query(
      'ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_av"',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attribute_values" DROP CONSTRAINT "FK_product_attribute_values_pa"',
    );
    await queryRunner.query('DROP TABLE "product_attribute_values"');

    await queryRunner.query(
      'ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_attribute"',
    );
    await queryRunner.query(
      'ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_product_attributes_product"',
    );
    await queryRunner.query('DROP TABLE "product_attributes"');

    await queryRunner.query(
      'ALTER TABLE "attribute_values" DROP CONSTRAINT "FK_attribute_values_attribute"',
    );
    await queryRunner.query('DROP TABLE "attribute_values"');
    await queryRunner.query('DROP TABLE "attributes"');

    await queryRunner.query(
      'ALTER TABLE "inventory" DROP CONSTRAINT "FK_inventory_variant"',
    );
    await queryRunner.query('DROP TABLE "inventory"');

    await queryRunner.query(
      'ALTER TABLE "product_variants" DROP CONSTRAINT "FK_product_variants_product"',
    );
    await queryRunner.query('DROP TABLE "product_variants"');

    await queryRunner.query(
      'ALTER TABLE "products" DROP CONSTRAINT "FK_products_vendor"',
    );
    await queryRunner.query('DROP TABLE "products"');
    await queryRunner.query('DROP TYPE "public"."products_status_enum"');

    await queryRunner.query(
      'ALTER TABLE "vendors" DROP CONSTRAINT "FK_vendors_user"',
    );
    await queryRunner.query('DROP TABLE "vendors"');

    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "vendorStatus"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "isVendor"');

    await queryRunner.query(
      'DROP TYPE "public"."product_variants_status_enum"',
    );
    await queryRunner.query('DROP TYPE "public"."users_vendorstatus_enum"');
  }
}
