import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type { SchemeQualitySummary } from './schemeQualitySummary';
import type {
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeTypes';

type SchemeParams = NonNullable<SchemeDecodeResult['schemeInfo']>['params'];

export interface SchemeViewerParamSection {
  title: string;
  params: SchemeParams;
}

export interface SchemeDiagnosticSummaryItem {
  key: string;
  label: string;
  title?: string;
}

export const getSchemeViewerParamCount = (params: SchemeParams): number => {
  if (!params) return 0;

  return Object.values(params).reduce((count, value) => (
    count + (Array.isArray(value) ? value.length : 1)
  ), 0);
};

export const getSchemeViewerParamEntries = (
  params: SchemeParams
): Array<[string, string | string[]]> => (
  Object.entries(params || {}) as Array<[string, string | string[]]>
);

export const buildSchemeViewerParamSections = (
  schemeInfo: SchemeDecodeResult['schemeInfo']
): SchemeViewerParamSection[] => {
  if (!schemeInfo) return [];

  return [
    { title: 'Query 参数', params: schemeInfo.params },
    { title: 'Hash 参数', params: schemeInfo.hashParams },
  ].filter(section => getSchemeViewerParamCount(section.params) > 0);
};

export const sumSchemeSkippedDecodeCount = (
  decodeWarnings: SchemeDecodeWarning[]
): number => (
  decodeWarnings.reduce((total, warning) => total + warning.skippedCount, 0)
);

interface BuildSchemeDiagnosticSummaryItemsOptions {
  decodeResult: Pick<SchemeDecodeResult, 'schemeInfo' | 'layers'>;
  commandSummaryInfo?: SchemeCommandSummaryInfo | null;
  paramSections: SchemeViewerParamSection[];
  paramStages: SchemeParamDecodeStage[];
  placeholders: SchemePlaceholder[];
  skippedDecodeCount: number;
  base64MetaInfo?: Base64MetaInfo | null;
}

export const buildSchemeDiagnosticSummaryItems = ({
  decodeResult,
  commandSummaryInfo,
  paramSections,
  paramStages,
  placeholders,
  skippedDecodeCount,
  base64MetaInfo,
}: BuildSchemeDiagnosticSummaryItemsOptions): SchemeDiagnosticSummaryItem[] => {
  const items: SchemeDiagnosticSummaryItem[] = [];

  if (decodeResult.schemeInfo) {
    const schemeLabel = [
      decodeResult.schemeInfo.protocol,
      decodeResult.schemeInfo.host,
      decodeResult.schemeInfo.path,
    ].filter(Boolean).join(' · ');
    items.push({
      key: 'scheme',
      label: schemeLabel || 'Scheme',
      title: '已识别 Scheme 信息',
    });
  }

  if (commandSummaryInfo?.commandSchemaCount) {
    items.push({
      key: 'cmd',
      label: `CMD · ${commandSummaryInfo.commandSchemaCount}`,
      title: '已识别 CMD 结构',
    });
  }

  const totalParamCount = paramSections.reduce(
    (total, section) => total + getSchemeViewerParamCount(section.params),
    0
  );
  if (totalParamCount > 0) {
    items.push({
      key: 'params',
      label: `参数 · ${totalParamCount}`,
      title: '已识别 URL 参数来源',
    });
  }

  if (paramStages.length > 0) {
    items.push({
      key: 'param-stages',
      label: `参数层 · ${paramStages.length}`,
      title: '已识别参数递归解码链路',
    });
  }

  if (decodeResult.layers.length > 0) {
    items.push({
      key: 'layers',
      label: `解码层 · ${decodeResult.layers.length}`,
      title: '已识别整体解码链路',
    });
  }

  if (placeholders.length > 0) {
    items.push({
      key: 'placeholders',
      label: `占位符 · ${placeholders.length}`,
      title: '已识别运行时占位符',
    });
  }

  if (skippedDecodeCount > 0) {
    items.push({
      key: 'skipped',
      label: `跳过 · ${skippedDecodeCount}`,
      title: '性能护栏跳过的长字符串数量',
    });
  }

  if (base64MetaInfo) {
    items.push({
      key: 'base64',
      label: 'Base64 线索',
      title: '已识别内部 Base64 后缀信息',
    });
  }

  return items;
};

interface HasSchemeDiagnosticDetailsOptions {
  schemeQualitySummary?: SchemeQualitySummary | null;
  decodeResult: Pick<SchemeDecodeResult, 'schemeInfo' | 'layers'>;
  commandSummaryInfo?: SchemeCommandSummaryInfo | null;
  paramSections: SchemeViewerParamSection[];
  paramStages: SchemeParamDecodeStage[];
  placeholders: SchemePlaceholder[];
  decodeWarnings: SchemeDecodeWarning[];
  base64MetaInfo?: Base64MetaInfo | null;
}

export const hasSchemeDiagnosticDetails = ({
  schemeQualitySummary,
  decodeResult,
  commandSummaryInfo,
  paramSections,
  paramStages,
  placeholders,
  decodeWarnings,
  base64MetaInfo,
}: HasSchemeDiagnosticDetailsOptions): boolean => Boolean(
  schemeQualitySummary ||
  decodeResult.schemeInfo ||
  commandSummaryInfo ||
  decodeResult.layers.length > 0 ||
  paramSections.length > 0 ||
  paramStages.length > 0 ||
  placeholders.length > 0 ||
  decodeWarnings.length > 0 ||
  base64MetaInfo
);
