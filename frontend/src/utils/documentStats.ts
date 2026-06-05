export interface DocumentStats {
  totalLines: number;
  maxColumns: number;
}

/**
 * 单次扫描计算文档行列统计，避免大文件 split 产生额外数组和内存峰值
 */
export const getDocumentStats = (content: string): DocumentStats => {
  let totalLines = 1;
  let maxColumns = 0;
  let currentColumns = 0;

  for (let i = 0; i < content.length; i++) {
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

  return { totalLines, maxColumns };
};
