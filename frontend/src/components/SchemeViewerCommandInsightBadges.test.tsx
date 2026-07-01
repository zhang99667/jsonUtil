import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandInsightBadges } from './SchemeViewerCommandInsightBadges';

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

describe('SchemeViewerCommandInsightBadges', () => {
  it('渲染 cmd、ext 和 Base64 后缀线索', () => {
    const tree = SchemeViewerCommandInsightBadges({
      commandFields: ['cmd', 'panel_scheme', 'button_cmd', 'feed_cmd', 'hidden_cmd'],
      extFields: ['ext_info'],
      base64SuffixFields: ['os', 'ip'],
    });
    const text = collectText(tree);

    expect(text).toContain('cmd解析: cmd, panel_scheme, button_cmd, feed_cmd +1');
    expect(text).toContain('ext解析: ext_info');
    expect(text).toContain('Base64 后缀: os, ip');
  });

  it('空线索不渲染', () => {
    expect(SchemeViewerCommandInsightBadges({
      commandFields: [],
      extFields: [],
      base64SuffixFields: [],
    })).toBeNull();
  });
});
