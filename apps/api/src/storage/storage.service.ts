import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;

  private readonly buckets = ['videos', 'snapshots', 'avatars'] as const;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', ''),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', ''),
    });
  }

  async onModuleInit() {
    for (const bucket of this.buckets) {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
      }
    }
  }

  async getPresignedUploadUrl(
    bucket: string,
    objectName: string,
    expiry = 3600,
  ): Promise<string> {
    return this.client.presignedPutObject(bucket, objectName, expiry);
  }

  async getPresignedDownloadUrl(
    bucket: string,
    objectName: string,
    expiry = 3600,
  ): Promise<string> {
    return this.client.presignedGetObject(bucket, objectName, expiry);
  }

  async deleteObject(bucket: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucket, objectName);
  }

  async uploadBuffer(
    bucket: string,
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
  }
}
