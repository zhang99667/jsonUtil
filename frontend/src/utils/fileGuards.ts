export const MAX_TEXT_FILE_SIZE_BYTES = 50 * 1024 * 1024;

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

/**
 * 校验文本文件是否适合直接读入编辑器
 */
export const getTextFileOpenError = (
  file: Pick<File, 'name' | 'size'>,
  maxSize = MAX_TEXT_FILE_SIZE_BYTES
): string | null => {
  if (file.size <= maxSize) {
    return null;
  }

  const fileName = file.name || '未命名文件';
  return `文件「${fileName}」大小为 ${formatFileSize(file.size)}，超过 ${formatFileSize(maxSize)} 上限，请拆分后再打开。`;
};
