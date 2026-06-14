export interface DocumentStats {
  characterCount: number;
  utf8ByteLength: number;
  totalLines: number;
  maxColumns: number;
  isLimited: boolean;
}

interface DocumentStatsOptions {
  maxScanLength?: number;
}

export const formatByteSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/**
 * 单次扫描计算文档行列统计，避免大文件 split 产生额外数组和内存峰值。
 * 大文件只扫描前半段，避免辅助状态栏统计拖慢编辑输入。
 */
export const getDocumentStats = (content: string, options: DocumentStatsOptions = {}): DocumentStats => {
  const maxScanLength = options.maxScanLength ?? Number.POSITIVE_INFINITY;
  const scanLength = Math.min(content.length, maxScanLength);
  const isLimited = scanLength < content.length;
  let totalLines = 1;
  let maxColumns = 0;
  let currentColumns = 0;
  let utf8ByteLength = 0;

  for (let i = 0; i < scanLength; i++) {
    const charCode = content.charCodeAt(i);
    if (charCode === 10) {
      totalLines++;
      if (currentColumns > maxColumns) {
        maxColumns = currentColumns;
      }
      currentColumns = 0;
    } else {
      currentColumns++;
    }

    if (charCode <= 0x7F) {
      utf8ByteLength += 1;
    } else if (charCode <= 0x7FF) {
      utf8ByteLength += 2;
    } else if (charCode >= 0xD800 && charCode <= 0xDBFF && i + 1 < scanLength) {
      const nextCharCode = content.charCodeAt(i + 1);
      if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF) {
        utf8ByteLength += 4;
        i++;
        currentColumns++;
      } else {
        utf8ByteLength += 3;
      }
    } else {
      utf8ByteLength += 3;
    }
  }

  if (currentColumns > maxColumns) {
    maxColumns = currentColumns;
  }

  return {
    characterCount: content.length,
    utf8ByteLength,
    totalLines,
    maxColumns,
    isLimited,
  };
};
