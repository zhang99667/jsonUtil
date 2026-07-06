import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertElementLike, clickElement, collectText, findByType } from './componentElementTestHelpers';
import { JsonPathPanelTitle } from './JsonPathPanelTitle';

describe('JsonPathPanelTitle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('展示标题并提供 JSONPath 语法帮助入口', () => {
    const openSpy = vi.fn();
    vi.stubGlobal('window', { open: openSpy });
    const tree = assertElementLike(JsonPathPanelTitle());
    const helpButton = findByType(tree, 'button')[0];

    expect(collectText(tree)).toContain('JSONPath 查询');
    expect(helpButton.props).toMatchObject({
      title: '学习 JSONPath 语法',
      'aria-label': '学习 JSONPath 语法',
    });

    clickElement(helpButton);

    expect(openSpy).toHaveBeenCalledWith(
      'https://docs.apifox.com/doc-5725287',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
