import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandSchemaBadges } from './SchemeViewerCommandSchemaBadges';

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
  if (Array.isArray(node)) {
    return node.map(child => findByTourOrNull(child, dataTour)).find(Boolean) || null;
  }
  if (!isElementLike(node)) return null;
  if (node.props['data-tour'] === dataTour) return node;
  return findByTourOrNull(node.props.children, dataTour);
};

describe('SchemeViewerCommandSchemaBadges', () => {
  it('渲染主 Schema、Schema 数量和 Top Schema', () => {
    const tree = SchemeViewerCommandSchemaBadges({
      commandSchema: 'baiduboxapp://v7/vendor/ad/prerender',
      commandSchemaCount: 2,
      topCommandSchemas: [{
        schema: 'baiduboxapp://v7/vendor/ad/prerender',
        count: 2,
        paths: ['$', '$.nested'],
        hasMorePaths: false,
      }],
    });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-command-schema-count')).toBeTruthy();
    expect(findByTourOrNull(tree, 'scheme-top-command-schemas')).toBeTruthy();
    expect(text).toContain('cmdSchema=baiduboxapp://v7/vendor/ad/prerender');
    expect(text).toContain('Schema · 2');
    expect(text).toContain('baiduboxapp://v7/vendor/ad/prerender ×2');
  });

  it('截断过长 Top Schema 展示', () => {
    const longSchema = `baiduboxapp://v7/${'x'.repeat(80)}`;
    const tree = SchemeViewerCommandSchemaBadges({
      commandSchema: undefined,
      commandSchemaCount: 1,
      topCommandSchemas: [{
        schema: longSchema,
        count: 1,
        paths: ['$'],
        hasMorePaths: true,
      }],
    });

    expect(collectText(tree)).toContain(`${longSchema.slice(0, 42)}... ×1`);
  });
});
