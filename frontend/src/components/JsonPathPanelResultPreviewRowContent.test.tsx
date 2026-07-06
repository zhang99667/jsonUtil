import { describe, expect, it } from 'vitest';
import { assertElementLike, collectText, findByType } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewRowContent } from './JsonPathPanelResultPreviewRowContent';
import { createJsonPathResultPreviewItem } from './JsonPathPanelResultPreviewTestFixture';

const renderRowContent = (
  overrides: Partial<Parameters<typeof createJsonPathResultPreviewItem>[0]> = {}
) => JsonPathPanelResultPreviewRowContent({
  item: createJsonPathResultPreviewItem(overrides),
});

describe('JsonPathPanelResultPreviewRowContent', () => {
  it('渲染结果序号、来源、路径和值', () => {
    const tree = assertElementLike(renderRowContent());
    const spans = findByType(tree, 'span');

    expect(collectText(tree)).toContain('SOURCE');
    expect(collectText(tree)).toContain('$.data.items[0]');
    expect(collectText(tree)).toContain('"value"');
    expect(spans[0].props.children).toBe(3);
    expect(spans[1].props.title).toBe('SOURCE');
    expect(spans[2].props.title).toBe('$.data.items[0]');
    expect(spans[4].props.title).toBe('"value"');
  });

  it('没有来源时省略来源标签', () => {
    const tree = assertElementLike(renderRowContent({ sourceLabel: '' }));
    const spans = findByType(tree, 'span');

    expect(collectText(tree)).not.toContain('SOURCE');
    expect(spans[1].props.title).toBe('$.data.items[0]');
  });
});
