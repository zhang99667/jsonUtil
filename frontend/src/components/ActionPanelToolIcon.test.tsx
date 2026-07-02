import { describe, expect, it } from 'vitest';
import {
  ACTION_PANEL_TOOL_ICON_IDS,
  type ActionPanelToolIconId,
} from '../utils/actionPanelToolGroupTypes';
import { ActionPanelToolIcon } from './ActionPanelToolIcon';

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
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (!isElementLike(node)) return '';
  return collectText(node.props.children);
};

const TEXT_ICON_LABELS: Partial<Record<ActionPanelToolIconId, string>> = {
  escape: '\\n',
  quote: '"',
  unicode: '\\u',
  chinese: 'cn',
  percent: '%',
  url: 'Ur',
  base64: 'B64',
  'base64-short': '64',
  typescript: 'TS',
};

describe('ActionPanelToolIcon', () => {
  it('显式支持所有工具栏 iconId', () => {
    ACTION_PANEL_TOOL_ICON_IDS.forEach(iconId => {
      const icon = ActionPanelToolIcon({ iconId });

      expect(isElementLike(icon)).toBe(true);
    });
  });

  it('文本图标保留固定短标签', () => {
    Object.entries(TEXT_ICON_LABELS).forEach(([iconId, label]) => {
      const icon = ActionPanelToolIcon({ iconId: iconId as ActionPanelToolIconId });

      expect(collectText(icon)).toBe(label);
    });
  });

  it('SVG 图标都返回带 path 的矢量图，sort 不再依赖默认兜底', () => {
    const svgIconIds = ACTION_PANEL_TOOL_ICON_IDS.filter(iconId => !(iconId in TEXT_ICON_LABELS));

    expect(svgIconIds).toContain('sort');
    svgIconIds.forEach(iconId => {
      const icon = ActionPanelToolIcon({ iconId });

      expect(isElementLike(icon)).toBe(true);
      if (!isElementLike(icon)) throw new Error('工具栏 SVG 图标应返回 React 元素');
      expect(icon.type).toBe('svg');
      expect(icon.props.children).toMatchObject({
        type: 'path',
      });
    });
  });
});
