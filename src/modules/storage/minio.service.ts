/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';

export type UploadedBinaryFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor(private readonly configService: ConfigService) {
    const endPoint =
      this.configService.get<string>('MINIO_ENDPOINT') ?? '127.0.0.1';
    const port = Number(this.configService.get<string>('MINIO_PORT') ?? 9000);
    const useSSL =
      (this.configService.get<string>('MINIO_USE_SSL') ?? '').toLowerCase() ===
      'true';

    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');

    if (!accessKey || !secretKey) {
      throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required');
    }

    this.bucket = this.configService.get<string>('MINIO_BUCKET') ?? 'products';
    this.publicBaseUrl =
      this.configService.get<string>('MINIO_PUBLIC_BASE_URL') ?? null;

    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (exists) {
      await this.ensurePublicReadPolicy();
      return;
    }
    await this.client.makeBucket(this.bucket);
    await this.ensurePublicReadPolicy();
  }

  private async ensurePublicReadPolicy(): Promise<void> {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    });

    await this.client.setBucketPolicy(this.bucket, policy);
  }

  async uploadProductVariantImage(params: {
    productId: string;
    variantId: string;
    file: UploadedBinaryFile;
  }): Promise<{ objectKey: string; url: string }> {
    await this.ensureBucketExists();

    const ext = this.getFileExt(params.file.originalname);
    const objectKey = `products/${params.productId}/variants/${params.variantId}/${randomUUID()}${ext}`;

    await this.client.putObject(
      this.bucket,
      objectKey,
      params.file.buffer,
      params.file.size,
      {
        'Content-Type': params.file.mimetype,
      },
    );

    return { objectKey, url: this.toPublicUrl(objectKey) };
  }

  private toPublicUrl(objectKey: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/+$/, '')}/${this.bucket}/${objectKey}`;
    }

    const endPoint =
      this.configService.get<string>('MINIO_ENDPOINT') ?? '127.0.0.1';
    const port = Number(this.configService.get<string>('MINIO_PORT') ?? 9000);
    const useSSL =
      (this.configService.get<string>('MINIO_USE_SSL') ?? '').toLowerCase() ===
      'true';

    const scheme = useSSL ? 'https' : 'http';
    return `${scheme}://${endPoint}:${port}/${this.bucket}/${objectKey}`;
  }

  private getFileExt(originalName: string): string {
    const i = originalName.lastIndexOf('.');
    if (i === -1) {
      return '';
    }
    const ext = originalName.slice(i).toLowerCase();
    if (ext.length > 10) {
      return '';
    }
    return ext;
  }
}
