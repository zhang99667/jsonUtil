import { describe, expect, it } from 'vitest';
import { assertElementLike, findByType } from './componentElementTestHelpers';
import {
  JsonPathPanelResultToolbarIcon,
  type JsonPathPanelResultToolbarIconName,
} from './JsonPathPanelResultToolbarIcon';

const toolbarIcons: JsonPathPanelResultToolbarIconName[] = [
  'copyValues',
  'copyPathValues',
  'previous',
  'next',
];

describe('JsonPathPanelResultToolbarIcon', () => {
  it('为所有工具条图标渲染统一 SVG 外壳', () => {
    toolbarIcons.forEach(icon => {
      const tree = assertElementLike(JsonPathPanelResultToolbarIcon({ icon }));

      expect(tree.props).toMatchObject({
        className: 'w-4 h-4',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      });
      expect(findByType(tree, 'path').length).toBeGreaterThan(0);
    });
  });

  it('复制路径和值图标保留文档和折角两段路径', () => {
    const tree = JsonPathPanelResultToolbarIcon({ icon: 'copyPathValues' });

    expect(findByType(tree, 'path')).toHaveLength(2);
  });
});
