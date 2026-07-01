import { describe, expect, it } from 'vitest';
import type { SchemeViewerParamSection } from '../utils/schemeViewerDiagnostics';
import { SchemeViewerParamSectionsPanel } from './SchemeViewerParamSectionsPanel';

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

const buildSections = (): SchemeViewerParamSection[] => [{
  title: 'Query 参数',
  params: {
    url: 'https://jiankang.baidu.com/mall/pages/goods/detail-lite/index?skuId=243',
    from: 'ad',
    skuId: '243',
    storeId: '1763',
    fid: 'abc',
    tags: ['one', 'two'],
    extra: 'hidden',
  },
}];

describe('SchemeViewerParamSectionsPanel', () => {
  it('没有参数来源时不渲染', () => {
    expect(SchemeViewerParamSectionsPanel({ paramSections: [] })).toBeNull();
  });

  it('渲染参数来源、参数数量和前 6 个参数', () => {
    const tree = SchemeViewerParamSectionsPanel({ paramSections: buildSections() });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-param-sections')).toBeTruthy();
    expect(text).toContain('Query 参数 · 8');
    expect(text).toContain('url=https://jiankang.baidu.com/mall/pages/goods/deta...');
    expect(text).toContain('tags=one, two');
    expect(text).toContain('+1');
    expect(text).not.toContain('extra=hidden');
  });
});
