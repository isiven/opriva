export function fmtFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function fmtUploadedAt(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return isoStr.slice(0, 10);
  }
}

export function autoFillDocName(rawFileName) {
  return rawFileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

export function extractFileMetadata(file) {
  return {
    filePick: file.name,
    fileName: file.name,
    fileType: file.type || '',
    fileSize: file.size || 0,
    fileLastModified: file.lastModified || 0,
    uploadedAt: new Date().toISOString(),
  };
}
