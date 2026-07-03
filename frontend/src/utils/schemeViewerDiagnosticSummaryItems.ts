import type {
  Base64MetaInfo,
  SchemeCommandSummaryInfo,
} from './schemeMetadata';
import type {
  SchemeDecodeResult,
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
} from './schemeTypes';
import {
  getSchemeViewerParamCount,
  type SchemeViewerParamSection,
} from './schemeViewerParamSections';

export interface SchemeDiagnosticSummaryItem {
  key: string;
  label: string;
  title?: string;
}

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

const compactSummaryItems = (
  items: Array<SchemeDiagnosticSummaryItem | null | false>
): SchemeDiagnosticSummaryItem[] => (
  items.filter(Boolean) as SchemeDiagnosticSummaryItem[]
);

export const buildSchemeDiagnosticSummaryItems = ({
  decodeResult,
  commandSummaryInfo,
  paramSections,
  paramStages,
  placeholders,
  skippedDecodeCount,
  base64MetaInfo,
}: BuildSchemeDiagnosticSummaryItemsOptions): SchemeDiagnosticSummaryItem[] => {
  const schemeLabel = decodeResult.schemeInfo
    ? [
      decodeResult.schemeInfo.protocol,
      decodeResult.schemeInfo.host,
      decodeResult.schemeInfo.path,
    ].filter(Boolean).join(' · ')
    : '';
  const totalParamCount = paramSections.reduce(
    (total, section) => total + getSchemeViewerParamCount(section.params),
    0
  );

  return compactSummaryItems([
    decodeResult.schemeInfo && {
      key: 'scheme',
      label: schemeLabel || 'Scheme',
      title: '已识别 Scheme 信息',
    },
    Boolean(commandSummaryInfo?.commandSchemaCount) && {
      key: 'cmd',
      label: `CMD · ${commandSummaryInfo?.commandSchemaCount}`,
      title: '已识别 CMD 结构',
    },
    totalParamCount > 0 && {
      key: 'params',
      label: `参数 · ${totalParamCount}`,
      title: '已识别 URL 参数来源',
    },
    paramStages.length > 0 && {
      key: 'param-stages',
      label: `参数层 · ${paramStages.length}`,
      title: '已识别参数递归解码链路',
    },
    decodeResult.layers.length > 0 && {
      key: 'layers',
      label: `解码层 · ${decodeResult.layers.length}`,
      title: '已识别整体解码链路',
    },
    placeholders.length > 0 && {
      key: 'placeholders',
      label: `占位符 · ${placeholders.length}`,
      title: '已识别运行时占位符',
    },
    skippedDecodeCount > 0 && {
      key: 'skipped',
      label: `跳过 · ${skippedDecodeCount}`,
      title: '性能护栏跳过的长字符串数量',
    },
    Boolean(base64MetaInfo) && {
      key: 'base64',
      label: 'Base64 线索',
      title: '已识别内部 Base64 后缀信息',
    },
  ]);
};
