import { describe, expect, it, vi } from 'vitest';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import type { SchemeQualitySummary } from '../utils/schemeQualitySummary';
import type {
  SchemeDecodeWarning,
  SchemeParamDecodeStage,
  SchemePlaceholder,
  SchemePlaceholderGroup,
} from '../utils/schemeTypes';
import type { SchemeViewerParamSection } from '../utils/schemeViewerDiagnostics';
import { SchemeViewerBase64MetaPanel } from './SchemeViewerBase64MetaPanel';
import { SchemeViewerCommandSummaryPanel } from './SchemeViewerCommandSummaryPanel';
import { SchemeViewerDecodeLayersPanel } from './SchemeViewerDecodeLayersPanel';
import { SchemeViewerDiagnosticsPanel } from './SchemeViewerDiagnosticsPanel';
import { SchemeViewerParamSectionsPanel } from './SchemeViewerParamSectionsPanel';
import { SchemeViewerParamStagesPanel } from './SchemeViewerParamStagesPanel';
import { SchemeViewerRuntimePlaceholdersPanel } from './SchemeViewerRuntimePlaceholdersPanel';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

const findByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByTour(node.props.children, dataTour));
};

const findByTypeOrNull = (node: unknown, type: unknown): ElementLike | null => {
  if (Array.isArray(node)) {
    return node.map(child => findByTypeOrNull(child, type)).find(Boolean) || null;
  }
  if (!isElementLike(node)) return null;
  if (node.type === type) return node;
  return findByTypeOrNull(node.props.children, type);
};

const findButtonsByText = (node: unknown, label: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findButtonsByText(child, label));
  if (!isElementLike(node)) return [];

  const matches = node.type === 'button' && collectText(node).includes(label) ? [node] : [];
  return matches.concat(findButtonsByText(node.props.children, label));
};

const clickElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};

const qualitySummary: SchemeQualitySummary = {
  level: 'success',
  label: '解析完成',
  description: '已识别 CMD、参数和可复制结构',
  items: [
    { label: 'CMD', value: 1, tone: 'cyan' },
    { label: '解码层', value: 2, tone: 'success' },
  ],
};

const commandSummaryInfo: SchemeCommandSummaryInfo = {
  commandSchema: 'baiduboxapp://v7/vendor/ad/prerender',
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

const placeholders: SchemePlaceholder[] = [
  { path: '$.uid', value: '${UID}', description: '用户 ID' },
];
const placeholderGroups: SchemePlaceholderGroup[] = [
  { value: '${UID}', description: '用户 ID', count: 1, paths: ['$.uid'] },
];
const decodeWarnings: SchemeDecodeWarning[] = [{
  type: 'json_string_decode_skipped',
  message: '部分字符串过长，已跳过递归解析',
  skippedCount: 2,
  decodedStringCount: 3,
  totalStringLength: 2048,
  limit: 1024,
  paths: ['$.large'],
}];
const paramSections: SchemeViewerParamSection[] = [
  { title: 'Query 参数', params: { url: 'https://example.com' } },
];
const paramStages: SchemeParamDecodeStage[] = [{
  path: '$.params.url',
  key: 'url',
  source: 'query',
  raw: 'https%3A%2F%2Fexample.com',
  urlDecoded: 'https://example.com',
  parsed: 'https://example.com',
  reencoded: 'https%3A%2F%2Fexample.com',
  reversible: true,
}];

const renderPanel = (
  overrides: Partial<Parameters<typeof SchemeViewerDiagnosticsPanel>[0]> = {}
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
  schemeInfo: {
    protocol: 'baiduboxapp:',
    host: 'v7',
    path: '/vendor/ad/prerender',
  },
  commandSummaryInfo,
  placeholders,
  placeholderGroups,
  decodeWarnings,
  paramSections,
  paramStages,
  base64MetaInfo: null,
  layers: [
    {
      type: 'url-encoded',
      before: 'a%3D1',
      after: 'a=1',
      description: 'URL Decode',
    },
  ],
  decodedContent: '{"a":1}',
  isJson: true,
  ...overrides,
});

describe('SchemeViewerDiagnosticsPanel', () => {
  it('没有诊断详情时不渲染', () => {
    expect(renderPanel({ hasDiagnosticDetails: false })).toBeNull();
  });

  it('折叠态渲染摘要并透传展开回调', () => {
    const onToggleExpanded = vi.fn();
    const tree = renderPanel({ isExpanded: false, onToggleExpanded });
    const text = collectText(tree);

    expect(findByTour(tree, 'scheme-diagnostics-panel')).toHaveLength(1);
    expect(text).toContain('解析完成');
    expect(text).toContain('CMD · 1');
    expect(text).toContain('展开详情');
    expect(findByTour(tree, 'scheme-quality-summary')).toHaveLength(0);

    clickElement(findButtonsByText(tree, '展开详情')[0]);
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('展开态渲染质量摘要、警告和操作按钮', () => {
    const onInspectOriginal = vi.fn();
    const onCopyQualitySummary = vi.fn();
    const onCopyQualitySnapshot = vi.fn();
    const tree = renderPanel({
      onInspectOriginal,
      onCopyQualitySummary,
      onCopyQualitySnapshot,
    });
    const text = collectText(tree);

    expect(findByTour(tree, 'scheme-quality-summary')).toHaveLength(1);
    expect(text).toContain('已识别 CMD、参数和可复制结构');
    expect(text).toContain('性能保护 · 跳过 2');
    expect(text).toContain('$.large');

    clickElement(findByTour(tree, 'scheme-inspect-original')[0]);
    clickElement(findByTour(tree, 'scheme-copy-quality-summary')[0]);
    clickElement(findByTour(tree, 'scheme-copy-quality-snapshot')[0]);

    expect(onInspectOriginal).toHaveBeenCalledTimes(1);
    expect(onCopyQualitySummary).toHaveBeenCalledTimes(1);
    expect(onCopyQualitySnapshot).toHaveBeenCalledTimes(1);
  });

  it('透传各个诊断子面板的数据', () => {
    const tree = renderPanel();

    expect(findByTypeOrNull(tree, SchemeViewerCommandSummaryPanel)?.props.commandSummaryInfo).toBe(commandSummaryInfo);
    expect(findByTypeOrNull(tree, SchemeViewerRuntimePlaceholdersPanel)?.props).toMatchObject({
      placeholders,
      placeholderGroups,
    });
    expect(findByTypeOrNull(tree, SchemeViewerParamSectionsPanel)?.props.paramSections).toBe(paramSections);
    expect(findByTypeOrNull(tree, SchemeViewerParamStagesPanel)?.props.paramStages).toBe(paramStages);
    expect(findByTypeOrNull(tree, SchemeViewerBase64MetaPanel)?.props.base64MetaInfo).toBeNull();
    expect(findByTypeOrNull(tree, SchemeViewerDecodeLayersPanel)?.props).toMatchObject({
      decodedContent: '{"a":1}',
      isJson: true,
    });
  });
});
