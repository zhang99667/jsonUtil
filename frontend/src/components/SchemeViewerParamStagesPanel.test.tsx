import { describe, expect, it } from 'vitest';
import type { SchemeParamDecodeStage } from '../utils/schemeTypes';
import { SchemeViewerParamStagesPanel } from './SchemeViewerParamStagesPanel';

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

const collectByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => collectByTour(child, dataTour));
  if (!isElementLike(node)) return [];
  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  const children = node.props.children;
  if (Array.isArray(children)) {
    return [...matches, ...children.flatMap(child => collectByTour(child, dataTour))];
  }
  return [...matches, ...collectByTour(children, dataTour)];
};

const buildStage = (overrides: Partial<SchemeParamDecodeStage> = {}): SchemeParamDecodeStage => ({
  path: '$.params.url',
  key: 'url',
  source: 'query',
  raw: '%7B%22skuId%22%3A%22243%22%7D',
  urlDecoded: '{"skuId":"243"}',
  parsed: '{"skuId":"243"}',
  reencoded: '%7B%22skuId%22%3A%22243%22%7D',
  reversible: true,
  ...overrides,
});

describe('SchemeViewerParamStagesPanel', () => {
  it('没有参数分层时不渲染', () => {
    expect(SchemeViewerParamStagesPanel({ paramStages: [] })).toBeNull();
  });

  it('渲染参数分层链路、修复提示和可重新编码状态', () => {
    const tree = SchemeViewerParamStagesPanel({
      paramStages: [buildStage({ repairHint: '补齐 loose JSON 引号' })],
    });
    const text = collectText(tree);
    const stage = collectByTour(tree, 'scheme-param-stage')[0];

    expect(collectByTour(tree, 'scheme-param-stages')).toHaveLength(1);
    expect(text).toContain('参数分层 · 1');
    expect(text).toContain('Raw → URL Decode → JSON/CMD 解析 → 重新编码');
    expect(text).toContain('Query');
    expect(text).toContain('$.params.url');
    expect(text).toContain('补齐 loose JSON 引号');
    expect(text).toContain('可重新编码');
    expect(stage.props.title).toContain('修复提示: 补齐 loose JSON 引号');
  });

  it('最多展示前 6 个参数分层并提示剩余数量', () => {
    const paramStages = Array.from({ length: 7 }, (_, index) => buildStage({
      path: `$.params.item${index}`,
      key: `item${index}`,
      reversible: index % 2 === 0,
    }));
    const tree = SchemeViewerParamStagesPanel({ paramStages });
    const text = collectText(tree);

    expect(collectByTour(tree, 'scheme-param-stage')).toHaveLength(6);
    expect(text).toContain('还有 1 个参数分层未展示');
    expect(text).toContain('需确认');
    expect(text).not.toContain('$.params.item6');
  });
});
