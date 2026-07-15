import { vi } from 'vitest';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import type {
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
  SchemePlaceholderGroup,
} from '../utils/schemeTypes';
import type { SchemeViewerParamSection } from '../utils/schemeViewerDiagnostics';
import { SchemeViewerDiagnosticsPanel } from './SchemeViewerDiagnosticsPanel';

type SchemeViewerDiagnosticsPanelProps = Parameters<typeof SchemeViewerDiagnosticsPanel>[0];

export const qualitySummary: SchemeQualitySummary = {
  level: 'success',
  label: '解析完成',
  description: '已识别 CMD、参数和可复制结构',
  items: [
    { label: 'CMD', value: 1, tone: 'cyan' },
    { label: '解码层', value: 2, tone: 'success' },
  ],
};

export const commandSummaryInfo: SchemeCommandSummaryInfo = {
  commandSchema: 'sampleapp://v7/vendor/ad/prerender',
  paramCount: 1,
  paramKeys: ['url'],
  commandSchemaCount: 1,
  topCommandSchemas: [],
  commandFields: ['cmd'],
  commandFieldRows: [],
  commandFieldCount: 1,
  resourceFields: [],
  resourceFieldRows: [],
  resourceFieldCount: 0,
  extFields: [],
  extFieldCount: 0,
  base64SuffixFields: [],
  base64SuffixFieldCount: 0,
};

export const placeholders: SchemePlaceholder[] = [{ path: '$.uid', value: '${UID}', description: '用户 ID' }];

export const placeholderGroups: SchemePlaceholderGroup[] = [{
  value: '${UID}', description: '用户 ID', count: 1, paths: ['$.uid'],
}];

export const decodeWarnings: SchemeDecodeWarning[] = [{
  type: 'json_string_decode_skipped',
  message: '部分字符串过长，已跳过递归解析',
  skippedCount: 2,
  decodedStringCount: 3,
  totalStringLength: 2048,
  limit: 1024,
  paths: ['$.large'],
}];

export const paramSections: SchemeViewerParamSection[] = [{
  title: 'Query 参数', params: { url: 'https://example.com' },
}];

export const paramStages: SchemeParamDecodeStage[] = [{
  path: '$.params.url',
  key: 'url',
  source: 'query',
  raw: 'https%3A%2F%2Fexample.com',
  urlDecoded: 'https://example.com',
  parsed: 'https://example.com',
  reencoded: 'https%3A%2F%2Fexample.com',
  reversible: true,
}];

export const renderSchemeViewerDiagnosticsPanel = (
  overrides: Partial<SchemeViewerDiagnosticsPanelProps> = {}
) => SchemeViewerDiagnosticsPanel({
  hasDiagnosticDetails: true,
  isExpanded: true,
  onToggleExpanded: vi.fn(),
  schemeQualitySummary: qualitySummary,
  diagnosticSummaryItems: [
    { key: 'cmd', label: 'CMD · 1', title: '已识别 CMD 结构' },
    { key: 'layers', label: '解码层 · 2', title: '已识别整体解码链路' },
  ],
  canInspectOriginal: true,
  onInspectOriginal: vi.fn(),
  onCopyQualitySummary: vi.fn(),
  onCopyQualitySnapshot: vi.fn(),
  copyQualitySnapshotTitle: '复制质量快照',
  schemeInfo: { protocol: 'sampleapp:', host: 'v7', path: '/vendor/ad/prerender' },
  commandSummaryInfo,
  placeholders,
  placeholderGroups,
  decodeWarnings,
  paramSections,
  paramStages,
  base64MetaInfo: null,
  layers: [{ type: 'url-encoded', before: 'a%3D1', after: 'a=1', description: 'URL Decode' }],
  decodedContent: '{"a":1}',
  isJson: true,
  ...overrides,
});
