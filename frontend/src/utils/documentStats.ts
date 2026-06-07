export interface DocumentStats {
  totalLines: number;
  maxColumns: number;
  isLimited: boolean;
}

interface DocumentStatsOptions {
  maxScanLength?: number;
}

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

  for (let i = 0; i < scanLength; i++) {
    if (content.charCodeAt(i) === 10) {
      totalLines++;
      if (currentColumns > maxColumns) {
        maxColumns = currentColumns;
      }
      currentColumns = 0;
    } else {
      currentColumns++;
    }
  }

  if (currentColumns > maxColumns) {
    maxColumns = currentColumns;
  }

  return { totalLines, maxColumns, isLimited };
};
