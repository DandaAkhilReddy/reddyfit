import { BlobServiceClient } from '@azure/storage-blob';

const accountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT_NAME;
const sasToken = import.meta.env.VITE_AZURE_STORAGE_SAS_TOKEN;

// Check if Azure credentials are configured
export const isAzureConfigured = !!(accountName && sasToken);

let containerClient: any = null;

if (isAzureConfigured) {
  try {
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net?${sasToken}`
    );
    containerClient = blobServiceClient.getContainerClient('islandersdata');
  } catch (error) {
    console.warn('Azure Blob Storage initialization failed, using fallback data');
  }
}

export { containerClient };

export async function uploadJSON(blobName: string, data: any): Promise<void> {
  if (!containerClient) {
    throw new Error('Azure Blob Storage not configured');
  }
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const content = JSON.stringify(data, null, 2);
  await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: { blobContentType: 'application/json' }
  });
}

export async function downloadJSON<T>(blobName: string): Promise<T | null> {
  if (!containerClient) {
    return null;
  }
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await blobToString(await downloadResponse.blobBody);
    return JSON.parse(downloaded) as T;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    console.error('Azure Blob download error:', error.message);
    return null;
  }
}

export async function listBlobs(prefix: string): Promise<string[]> {
  if (!containerClient) {
    return [];
  }
  const blobs: string[] = [];
  try {
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
    }
  } catch (error: any) {
    console.error('Azure Blob list error:', error.message);
  }
  return blobs;
}

async function blobToString(blob: Blob | undefined): Promise<string> {
  if (!blob) return '';
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

export async function uploadPhoto(playerId: string, file: File): Promise<string> {
  if (!containerClient || !accountName) {
    throw new Error('Azure Blob Storage not configured');
  }
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const blobName = `photos/${playerId}.${fileExtension}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type }
  });

  return `https://${accountName}.blob.core.windows.net/islandersdata/${blobName}`;
}

export function getPhotoURL(playerId: string): string {
  if (!accountName) {
    return '/placeholder-avatar.jpg';
  }
  return `https://${accountName}.blob.core.windows.net/islandersdata/photos/${playerId}.jpg`;
}
