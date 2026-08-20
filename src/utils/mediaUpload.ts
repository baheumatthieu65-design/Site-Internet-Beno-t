const MAX_UPLOAD_BYTES = 2_500_000;

const blobToFile = (blob: Blob, original: File): File => {
  const base = original.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.webp`, { type: 'image/webp', lastModified: Date.now() });
};

/**
 * Vercel Functions have a request-size limit. Product images and module
 * backgrounds use the same upload path, so large images are compressed in the
 * browser before they are sent to /api/site-media.
 */
export async function prepareImageForUpload(file: File, maxBytes = MAX_UPLOAD_BYTES): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= maxBytes || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    if ((file.type === 'image/svg+xml' || file.type === 'image/gif') && file.size > maxBytes) {
      throw new Error('Cette image est trop volumineuse pour l’import direct. Utilisez un JPG, PNG ou WebP de moins de 2,5 Mo.');
    }
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = 2000;
    const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Préparation de l’image impossible.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.84;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (blob && blob.size <= maxBytes) break;
      quality -= 0.1;
    }

    if (!blob || blob.size > maxBytes) {
      throw new Error('Impossible de réduire suffisamment cette image. Choisissez une image de moins de 2,5 Mo.');
    }
    return blobToFile(blob, file);
  } finally {
    bitmap.close();
  }
}
