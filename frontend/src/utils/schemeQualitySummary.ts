import type { SchemeCommandSummaryInfo } from './schemeMetadata';
import type { SchemeDecodeResult, SchemeDecodeWarning, SchemePlaceholder } from './schemeUtils';

export type SchemeQualityLevel = 'success' | 'info' | 'warning' | 'error';

export interface SchemeQualitySummaryItem {
  label: string;
  value: number | string;
  tone?: 'default' | 'success' | 'warning' | 'cyan';
}

export interface SchemeQualitySummary {
  level: SchemeQualityLevel;
  label: string;
  description: string;
  items: SchemeQualitySummaryItem[];
}

export interface BuildSchemeQualitySummaryOptions {
  actualValue: string;
  isDecodePending: boolean;
  isDecodeCancelled: boolean;
  editedJsonError: string;
  decodeResult: SchemeDecodeResult;
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
  placeholders: SchemePlaceholder[];
  decodeWarnings: SchemeDecodeWarning[];
}

const sumSkippedCount = (decodeWarnings: SchemeDecodeWarning[]): number => (
  decodeWarnings.reduce((total, warning) => total + warning.skippedCount, 0)
);

const buildSummaryItems = (
  decodeResult: SchemeDecodeResult,
  commandSummaryInfo: SchemeCommandSummaryInfo | null,
  placeholders: SchemePlaceholder[],
  skippedCount: number
): SchemeQualitySummaryItem[] => [
  {
    label: '解码层',
    value: decodeResult.layers.length,
    tone: decodeResult.layers.length > 0 ? 'success' : 'default',
  },
  {
    label: 'CMD',
    value: commandSummaryInfo?.commandSchemaCount || 0,
    tone: commandSummaryInfo?.commandSchemaCount ? 'cyan' : 'default',
  },
  {
    label: 'CMD字段',
    value: commandSummaryInfo?.commandFieldCount || 0,
    tone: commandSummaryInfo?.commandFieldCount ? 'cyan' : 'default',
  },
  {
    label: '资源字段',
    value: commandSummaryInfo?.resourceFieldCount || 0,
    tone: commandSummaryInfo?.resourceFieldCount ? 'success' : 'default',
  },
  {
    label: '占位符',
    value: placeholders.length,
    tone: placeholders.length > 0 ? 'warning' : 'default',
  },
  {
    label: '跳过',
    value: skippedCount,
    tone: skippedCount > 0 ? 'warning' : 'default',
  },
];

export const buildSchemeQualitySummary = ({
  actualValue,
  isDecodePending,
  isDecodeCancelled,
  editedJsonError,
  decodeResult,
  commandSummaryInfo,
  placeholders,
  decodeWarnings,
}: BuildSchemeQualitySummaryOptions): SchemeQualitySummary | null => {
  if (!actualValue.trim()) return null;

  const skippedCount = sumSkippedCount(decodeWarnings);
  const items = buildSummaryItems(decodeResult, commandSummaryInfo, placeholders, skippedCount);

  if (isDecodeCancelled) {
    return {
      level: 'warning',
      label: '解析已取消',
      description: '大内容解析已停止，当前摘要只展示已知状态',
      items,
    };
  }

  if (isDecodePending) {
    return {
      level: 'info',
      label: '解析中',
      description: '大内容正在后台解析，完成后会刷新质量摘要',
      items,
    };
  }

  if (editedJsonError) {
    return {
      level: 'error',
      label: 'JSON 异常',
      description: '解码结果被编辑后格式不合法，需修正后再复制结构',
      items,
    };
  }

  if (decodeWarnings.length > 0) {
    return {
      level: 'warning',
      label: '部分跳过',
      description: `性能护栏跳过 ${skippedCount} 个长字符串，核心结构仍可查看`,
      items,
    };
  }

  if (placeholders.length > 0) {
    return {
      level: 'info',
      label: '结构可用',
      description: `发现 ${placeholders.length} 个运行时占位符，可回填后复查`,
      items,
    };
  }

  const hasStructuredSignal = Boolean(
    decodeResult.schemeInfo ||
    decodeResult.layers.length > 0 ||
    decodeResult.isJson ||
    commandSummaryInfo
  );

  if (hasStructuredSignal) {
    return {
      level: 'success',
      label: '解析完成',
      description: commandSummaryInfo
        ? '已识别 CMD、资源字段和可复制结构'
        : '已完成当前内容的解码与结构识别',
      items,
    };
  }

  return {
    level: 'info',
    label: '普通文本',
    description: '未识别到可展开的编码层或结构化 Scheme',
    items,
  };
};

export const formatSchemeQualitySummaryText = (summary: SchemeQualitySummary): string => (
  [
    'Scheme 解析质量摘要',
    `状态: ${summary.label}`,
    `说明: ${summary.description}`,
    ...summary.items.map(item => `${item.label}: ${item.value}`),
  ].join('\n')
);
