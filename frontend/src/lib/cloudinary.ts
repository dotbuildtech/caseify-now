import { uploadStudioImage, uploadStudioImageBlob } from '@/services/studioApi';

export async function uploadImage(dataUrl: string): Promise<string | null> {
  try { return await uploadStudioImage(dataUrl); } catch { return null; }
}

export async function uploadBlob(blob: Blob, mimeType = 'image/png'): Promise<string | null> {
  try { return await uploadStudioImageBlob(blob, mimeType); } catch { return null; }
}

export function getCloudinaryUrl(publicId: string, options?: { width?: number; height?: number; quality?: number; format?: string }): string {
  const base = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'}/image/upload`;
  const transforms: string[] = [];
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);
  if (options?.format) transforms.push(`f_${options.format}`);
  const tx = transforms.length > 0 ? `${transforms.join(',')}/` : '';
  return `${base}/${tx}${publicId}`;
}

export function getOptimizedUrl(url: string, width = 400): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  try {
    return url.replace('/image/upload/', `/image/upload/w_${width},q_auto,f_auto/`);
  } catch { return url; }
}
