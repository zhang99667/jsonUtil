import type { SchemeCommandSummaryInfo } from './schemeMetadata';
import type { SchemeDecodeResult, SchemeDecodeWarning, SchemePlaceholder } from './schemeUtils';
import { APP_VERSION_METADATA, type AppVersionMetadata } from './appVersion';

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

export interface SchemeQualitySnapshot {
  schemaVersion: 1;
  kind: 'json-helper-scheme-quality-snapshot';
  tool: AppVersionMetadata;
  safety: {
    containsRawValue: false;
    notes: string[];
  };
  status: {
    level: SchemeQualityLevel;
    label: string;
    description: string;
  };
  coverage: {
    score: number;
    label: string;
    level: 'success' | 'info' | 'warning';
    description: string;
    items: string[];
  };
  totals: {
    records: number;
    cmdStructures: number;
    nestedCommandFields: number;
    nestedResourceFields: number;
    unresolved: number;
    decodeLayers: number;
    commandSchemas: number;
    commandFields: number;
    resourceFields: number;
    extFields: number;
    base64SuffixFields: number;
    runtimePlaceholders: number;
    warnings: number;
    skipped: number;
  };
  hotspots: {
    topCommandSchemas: Array<{
      schema: string;
      count: number;
      paths: string[];
      hasMorePaths: boolean;
    }>;
    commandFields: string[];
    resourceFields: string[];
    extFields: string[];
    base64SuffixFields: string[];
    runtimePlaceholders: Array<{
      value: string;
      count: number;
      description: string;
      paths: string[];
    }>;
    warningTypes: Array<{
      type: string;
      skippedCount: number;
      decodedStringCount: number;
      pathCount: number;
      paths: string[];
    }>;
  };
  recommendations: string[];
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

export interface BuildSchemeQualitySnapshotOptions {
  summary: SchemeQualitySummary;
  decodeResult: SchemeDecodeResult;
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
  placeholders: SchemePlaceholder[];
  decodeWarnings: SchemeDecodeWarning[];
}

const SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT = 8;
const SCHEME_QUALITY_SNAPSHOT_PATH_LIMIT = 4;

const sumSkippedCount = (decodeWarnings: SchemeDecodeWarning[]): number => (
  decodeWarnings.reduce((total, warning) => total + warning.skippedCount, 0)
);

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

const buildPlaceholderGroups = (placeholders: SchemePlaceholder[]): SchemeQualitySnapshot['hotspots']['runtimePlaceholders'] => {
  const groupMap = new Map<string, SchemeQualitySnapshot['hotspots']['runtimePlaceholders'][number]>();

  placeholders.forEach(placeholder => {
    const current = groupMap.get(placeholder.value);
    if (current) {
      current.count += 1;
      if (current.paths.length < SCHEME_QUALITY_SNAPSHOT_PATH_LIMIT) {
        current.paths.push(placeholder.path);
      }
      return;
    }

    groupMap.set(placeholder.value, {
      value: placeholder.value,
      count: 1,
      description: placeholder.description,
      paths: [placeholder.path],
    });
  });

  return Array.from(groupMap.values())
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT);
};

const buildSnapshotRecommendations = (
  summary: SchemeQualitySummary,
  commandSummaryInfo: SchemeCommandSummaryInfo | null,
  placeholders: SchemePlaceholder[],
  decodeWarnings: SchemeDecodeWarning[]
): string[] => {
  const recommendations: string[] = [];

  if (summary.level === 'error') {
    recommendations.push('先修正解码结果中的 JSON 错误，再复制 CMD 结构或沉淀样本');
  }
  if (summary.level === 'warning' && decodeWarnings.length > 0) {
    recommendations.push('性能护栏已跳过长字符串，可单独粘贴对应字段或缩小 response 后复查');
  }
  if (placeholders.length > 0) {
    recommendations.push('运行时占位符不是解析失败，建议回填真实值后再次复制质量快照');
  }
  if (commandSummaryInfo?.commandSchemaCount) {
    recommendations.push('已识别 CMD Schema，可复制 CMD 结构与内部 cmdHandler 输出做子集对齐');
  }
  if (recommendations.length === 0) {
    recommendations.push('当前未发现占位符或性能跳过，可重点核对 CMD Schema 与业务预期是否一致');
  }

  return recommendations;
};

const buildSchemeSnapshotCoverage = (
  summary: SchemeQualitySummary,
  decodeResult: SchemeDecodeResult,
  commandSummaryInfo: SchemeCommandSummaryInfo | null,
  placeholders: SchemePlaceholder[],
  decodeWarnings: SchemeDecodeWarning[]
): SchemeQualitySnapshot['coverage'] => {
  const signalCount = (
    decodeResult.layers.length +
    (decodeResult.isJson ? 1 : 0) +
    (decodeResult.schemeInfo ? 1 : 0) +
    (commandSummaryInfo?.commandSchemaCount || 0) +
    (commandSummaryInfo?.commandFieldCount || 0) +
    (commandSummaryInfo?.resourceFieldCount || 0)
  );
  const attentionCount = (
    (summary.level === 'error' ? 1 : 0) +
    (summary.level === 'warning' && summary.label !== '解析已取消' && decodeWarnings.length === 0 ? 1 : 0) +
    (summary.label === '解析中' ? 1 : 0) +
    (summary.label === '解析已取消' ? 1 : 0) +
    (placeholders.length > 0 ? 1 : 0) +
    decodeWarnings.length
  );
  const score = signalCount + attentionCount === 0
    ? 100
    : Math.round((signalCount / (signalCount + attentionCount)) * 100);

  if (summary.level === 'error') {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'warning',
      description: '解码结果存在 JSON 编辑错误，结构指标只能反映修正前状态。',
      items: ['先修正 JSON 后再复制 CMD 结构或质量快照'],
    };
  }

  if ((summary.level === 'warning' && summary.label !== '解析已取消') || decodeWarnings.length > 0) {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'warning',
      description: `性能护栏跳过 ${sumSkippedCount(decodeWarnings)} 个长字符串，可能仍有未展开字段。`,
      items: [
        '优先查看性能保护路径',
        '超长字段可单独粘贴到 Scheme 面板继续拆解',
      ],
    };
  }

  if (summary.label === '解析中' || summary.label === '解析已取消') {
    return {
      score,
      label: `解析覆盖 ${score}%`,
      level: 'info',
      description: summary.description,
      items: ['等待解析完成或重新触发解析后再保存质量基线'],
    };
  }

  if (placeholders.length > 0) {
    return {
      score,
      label: `结构解析完成 · 占位符 ${placeholders.length}`,
      level: 'info',
      description: `已展开当前可解析结构，但仍有 ${placeholders.length} 个运行时占位符需要替换。`,
      items: [
        '占位符不是解析失败，可查看占位符路径确认待替换字段',
        '回填真实值后建议再次复制质量快照',
      ],
    };
  }

  return {
    score,
    label: `解析覆盖 ${score}%`,
    level: 'success',
    description: summary.description,
    items: [],
  };
};

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

export const buildSchemeQualitySnapshot = ({
  summary,
  decodeResult,
  commandSummaryInfo,
  placeholders,
  decodeWarnings,
}: BuildSchemeQualitySnapshotOptions): SchemeQualitySnapshot => {
  const skippedCount = sumSkippedCount(decodeWarnings);

  return {
    schemaVersion: 1,
    kind: 'json-helper-scheme-quality-snapshot',
    tool: APP_VERSION_METADATA,
    safety: {
      containsRawValue: false,
      notes: [
        '质量快照不包含原始 Scheme、解码结果或参数值',
        'paths 仅用于定位结构来源，Top schema 只保留解析出的 cmdSchema',
      ],
    },
    status: {
      level: summary.level,
      label: summary.label,
      description: summary.description,
    },
    coverage: buildSchemeSnapshotCoverage(summary, decodeResult, commandSummaryInfo, placeholders, decodeWarnings),
    totals: {
      records: decodeResult.layers.length,
      cmdStructures: commandSummaryInfo?.commandSchemaCount || 0,
      nestedCommandFields: commandSummaryInfo?.commandFieldCount || 0,
      nestedResourceFields: commandSummaryInfo?.resourceFieldCount || 0,
      unresolved: summary.level === 'error' ? 1 : 0,
      decodeLayers: decodeResult.layers.length,
      commandSchemas: commandSummaryInfo?.commandSchemaCount || 0,
      commandFields: commandSummaryInfo?.commandFieldCount || 0,
      resourceFields: commandSummaryInfo?.resourceFieldCount || 0,
      extFields: commandSummaryInfo?.extFieldCount || 0,
      base64SuffixFields: commandSummaryInfo?.base64SuffixFieldCount || 0,
      runtimePlaceholders: placeholders.length,
      warnings: decodeWarnings.length,
      skipped: skippedCount,
    },
    hotspots: {
      topCommandSchemas: (commandSummaryInfo?.topCommandSchemas || [])
        .slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT)
        .map(item => ({
          schema: item.schema,
          count: item.count,
          paths: item.paths.slice(0, SCHEME_QUALITY_SNAPSHOT_PATH_LIMIT),
          hasMorePaths: item.hasMorePaths || item.paths.length > SCHEME_QUALITY_SNAPSHOT_PATH_LIMIT,
        })),
      commandFields: dedupe(commandSummaryInfo?.commandFields || []).slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT),
      resourceFields: dedupe(commandSummaryInfo?.resourceFields || []).slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT),
      extFields: dedupe(commandSummaryInfo?.extFields || []).slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT),
      base64SuffixFields: dedupe(commandSummaryInfo?.base64SuffixFields || []).slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT),
      runtimePlaceholders: buildPlaceholderGroups(placeholders),
      warningTypes: decodeWarnings.slice(0, SCHEME_QUALITY_SNAPSHOT_TOP_LIMIT).map(warning => ({
        type: warning.type,
        skippedCount: warning.skippedCount,
        decodedStringCount: warning.decodedStringCount,
        pathCount: warning.paths.length,
        paths: warning.paths.slice(0, SCHEME_QUALITY_SNAPSHOT_PATH_LIMIT),
      })),
    },
    recommendations: buildSnapshotRecommendations(summary, commandSummaryInfo, placeholders, decodeWarnings),
  };
};

export const formatSchemeQualitySnapshotJsonText = (
  options: BuildSchemeQualitySnapshotOptions
): string => JSON.stringify(buildSchemeQualitySnapshot(options), null, 2);
