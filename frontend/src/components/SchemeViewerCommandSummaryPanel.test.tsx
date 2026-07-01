import { describe, expect, it } from 'vitest';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import { SchemeViewerCommandSummaryPanel } from './SchemeViewerCommandSummaryPanel';

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

const findByTourOrNull = (node: unknown, dataTour: string): ElementLike | null => {
  if (!isElementLike(node)) return null;
  if (node.props['data-tour'] === dataTour) return node;
  const children = node.props.children;
  if (Array.isArray(children)) {
    return children.map(child => findByTourOrNull(child, dataTour)).find(Boolean) || null;
  }
  return findByTourOrNull(children, dataTour);
};

const buildCommandSummary = (
  overrides: Partial<SchemeCommandSummaryInfo> = {}
): SchemeCommandSummaryInfo => ({
  commandSchema: 'baiduboxapp://v7/vendor/ad/prerender',
  paramCount: 8,
  paramKeys: ['url', 'from', 'skuId', 'storeId', 'fid', 'extra', 'hidden'],
  commandSchemaCount: 2,
  topCommandSchemas: [
    {
      schema: 'baiduboxapp://v7/vendor/ad/prerender',
      count: 2,
      paths: ['$', '$.nested'],
      hasMorePaths: false,
    },
  ],
  commandFields: ['cmd', 'panel_scheme', 'button_cmd', 'feed_cmd', 'hidden_cmd'],
  commandFieldRows: [],
  commandFieldCount: 5,
  resourceFields: [],
  resourceFieldRows: [],
  resourceFieldCount: 0,
  extFields: ['ext_info'],
  extFieldCount: 1,
  base64SuffixFields: ['os', 'ip'],
  base64SuffixFieldCount: 2,
  ...overrides,
});

describe('SchemeViewerCommandSummaryPanel', () => {
  it('没有 CMD 摘要时不渲染', () => {
    expect(SchemeViewerCommandSummaryPanel({ commandSummaryInfo: null })).toBeNull();
  });

  it('渲染 CMD Schema、Top Schema、参数和嵌套线索', () => {
    const tree = SchemeViewerCommandSummaryPanel({
      commandSummaryInfo: buildCommandSummary(),
    });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-command-summary')).toBeTruthy();
    expect(findByTourOrNull(tree, 'scheme-command-schema-count')).toBeTruthy();
    expect(findByTourOrNull(tree, 'scheme-top-command-schemas')).toBeTruthy();
    expect(text).toContain('CMD 结构');
    expect(text).toContain('cmdSchema=baiduboxapp://v7/vendor/ad/prerender');
    expect(text).toContain('Schema · 2');
    expect(text).toContain('baiduboxapp://v7/vendor/ad/prerender ×2');
    expect(text).toContain('cmdParams · 8');
    expect(text).toContain('skuId');
    expect(text).toContain('+1');
    expect(text).toContain('cmd解析: cmd, panel_scheme, button_cmd, feed_cmd +1');
    expect(text).toContain('ext解析: ext_info');
    expect(text).toContain('Base64 后缀: os, ip');
  });

  it('隐藏为空的 CMD 线索并截断 Top Schema 展示', () => {
    const longSchema = `baiduboxapp://v7/${'x'.repeat(80)}`;
    const tree = SchemeViewerCommandSummaryPanel({
      commandSummaryInfo: buildCommandSummary({
        commandSchema: undefined,
        paramCount: 0,
        paramKeys: [],
        commandSchemaCount: 1,
        topCommandSchemas: [{
          schema: longSchema,
          count: 1,
          paths: ['$'],
          hasMorePaths: true,
        }],
        commandFields: [],
        extFields: [],
        base64SuffixFields: [],
      }),
    });
    const text = collectText(tree);

    expect(text).not.toContain('cmdSchema=');
    expect(text).not.toContain('cmdParams');
    expect(text).not.toContain('cmd解析');
    expect(text).toContain(`${longSchema.slice(0, 42)}... ×1`);
  });
});
