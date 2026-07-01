import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandParamBadges } from './SchemeViewerCommandParamBadges';

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

describe('SchemeViewerCommandParamBadges', () => {
  it('渲染参数数量、前 6 个 key 和剩余数量', () => {
    const tree = SchemeViewerCommandParamBadges({
      paramCount: 8,
      paramKeys: ['url', 'from', 'skuId', 'storeId', 'fid', 'extra', 'hidden'],
    });
    const text = collectText(tree);

    expect(text).toContain('cmdParams · 8');
    expect(text).toContain('skuId');
    expect(text).toContain('extra');
    expect(text).toContain('+1');
    expect(text).not.toContain('hidden');
  });
});
