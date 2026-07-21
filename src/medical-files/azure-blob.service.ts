import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient, BlobSASPermissions } from '@azure/storage-blob';

@Injectable()
export class AzureBlobService {
  private containerClient: ContainerClient;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  async uploadFile(blobPath: string, buffer: Buffer, mimeType: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
  }

  async getDownloadUrl(blobPath: string, expiryMinutes = 15): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    return blockBlobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      expiresOn: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });
  }

  async deleteFile(blobPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
  }
}