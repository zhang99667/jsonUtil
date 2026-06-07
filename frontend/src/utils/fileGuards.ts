export const MAX_TEXT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const TEXT_FILE_EXTENSIONS = new Set([
  'conf',
  'config',
  'css',
  'csv',
  'env',
  'html',
  'ini',
  'java',
  'js',
  'json',
  'jsonl',
  'jsx',
  'log',
  'md',
  'properties',
  'sql',
  'toml',
  'ts',
  'tsx',
  'txt',
  'xml',
  'yaml',
  'yml',
]);

const BINARY_FILE_EXTENSIONS = new Set([
  '7z',
  'avi',
  'bmp',
  'dmg',
  'doc',
  'docx',
  'exe',
  'gif',
  'gz',
  'heic',
  'ico',
  'jar',
  'jpeg',
  'jpg',
  'mov',
  'mp3',
  'mp4',
  'pdf',
  'png',
  'rar',
  'tar',
  'webp',
  'xls',
  'xlsx',
  'zip',
]);

const TEXT_MIME_TYPES = new Set([
  'application/javascript',
  'application/json',
  'application/ld+json',
  'application/sql',
  'application/typescript',
  'application/x-javascript',
  'application/x-ndjson',
  'application/xml',
  'application/yaml',
]);

const BINARY_MIME_TYPES = new Set([
  'application/gzip',
  'application/msword',
  'application/octet-stream',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/x-7z-compressed',
  'application/x-apple-diskimage',
  'application/x-rar-compressed',
  'application/x-tar',
  'application/zip',
]);

const BINARY_MIME_PREFIXES = ['audio/', 'image/', 'video/'];

/**
 * 将字节数格式化为用户可读的文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Number(size.toFixed(2))} ${units[unitIndex]}`;
};

const getFileExtension = (fileName: string): string => {
  const normalizedName = fileName.trim().toLowerCase();
  const dotIndex = normalizedName.lastIndexOf('.');

  if (dotIndex <= 0 || dotIndex === normalizedName.length - 1) {
    return '';
  }

  return normalizedName.slice(dotIndex + 1);
};

const isLikelyTextFile = (file: Pick<File, 'name'> & { type?: string }): boolean => {
  const extension = getFileExtension(file.name || '');
  const mimeType = (file.type || '').toLowerCase();

  if (BINARY_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))) {
    return false;
  }

  if (BINARY_MIME_TYPES.has(mimeType) && !TEXT_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    return true;
  }

  if (BINARY_FILE_EXTENSIONS.has(extension)) {
    return false;
  }

  if (!mimeType || mimeType.startsWith('text/') || TEXT_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return false;
};

/**
 * 校验文本文件是否适合直接读入编辑器
 */
export const getTextFileOpenError = (
  file: Pick<File, 'name' | 'size'> & { type?: string },
  maxSize = MAX_TEXT_FILE_SIZE_BYTES
): string | null => {
  if (file.size <= maxSize) {
    if (isLikelyTextFile(file)) {
      return null;
    }

    const fileName = file.name || '未命名文件';
    return `文件「${fileName}」看起来不是文本/JSON 文件，请选择 JSON、TXT、JS、TS、MD、YAML、XML、SQL 或日志类文本文件。`;
  }

  const fileName = file.name || '未命名文件';
  return `文件「${fileName}」大小为 ${formatFileSize(file.size)}，超过 ${formatFileSize(maxSize)} 上限，请拆分后再打开。`;
};
