const IMAGE_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.emf': 'image/emf',
  '.wmf': 'image/wmf',
  '.wdp': 'image/vnd.ms-photo',
  '.jxr': 'image/vnd.ms-photo',
  '.hdp': 'image/vnd.ms-photo',
  '.bmp': 'image/bmp',
  '.tif': 'image / tiff',
  '.tiff': 'image / tiff',
  '.svg': 'image/svg+xml',
};

export function getMimeType (filename: string): string {
  const idx = filename.lastIndexOf('.');
  const ext = idx !== -1 ? filename.slice(idx).toLowerCase() : '';
  return (ext && ext in IMAGE_MIME_TYPES)
    ? IMAGE_MIME_TYPES[ext]
    : 'application/octet-stream';
}
