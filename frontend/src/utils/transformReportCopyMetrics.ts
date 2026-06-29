import { formatByteSize, getDocumentStats } from './documentStats';
import {
  getTransformPathValueCopyRows,
  type TransformReportRecord,
} from './transformSummary';

export const formatCopySizeLabel = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

export const formatCopySuccessMessage = (label: string, content: string): string => (
  `已复制${label}（${formatCopySizeLabel(content)}）`
);

export const getPathValueCopyRowCount = (records: TransformReportRecord[]): number => (
  records.reduce((count, record) => count + getTransformPathValueCopyRows(record).length, 0)
);

export const isPathValueCopyLimited = (records: TransformReportRecord[], isRecordTruncated: boolean): boolean => (
  isRecordTruncated || records.some(record => {
    const copiedRowCount = getTransformPathValueCopyRows(record).length;
    return record.indexedDecodedPathCount > copiedRowCount || record.decodedPathCount > copiedRowCount;
  })
);

export const formatPathValueCopyCountLabel = (count: number, isLimited: boolean): string => (
  isLimited ? `已返回 ${count} 项` : `${count} 项`
);
