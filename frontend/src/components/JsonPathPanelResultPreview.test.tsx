import { describe, expect, it, vi } from 'vitest';
import { assertElementLike, findByType } from './componentElementTestHelpers';
import { createJsonPathResultPreviewItems } from './JsonPathPanelResultPreviewItemTestData';
import { JsonPathPanelResultPreviewFrame } from './JsonPathPanelResultPreviewFrame';
import { JsonPathPanelResultPreviewList } from './JsonPathPanelResultPreviewList';
import { JsonPathPanelResultPreviewMessages } from './JsonPathPanelResultPreviewMessages';
import { renderJsonPathPanelResultPreview } from './JsonPathPanelResultPreviewTestFixture';

describe('JsonPathPanelResultPreview', () => {
  it('无预览项时不渲染容器', () => {
    expect(renderJsonPathPanelResultPreview({ previewItems: [] })).toBeNull();
  });

  it('装配结果行和预览提示状态', () => {
    const onWheel = vi.fn();
    const previewItems = createJsonPathResultPreviewItems();
    const tree = assertElementLike(renderJsonPathPanelResultPreview({ onWheel, previewItems }));
    const frame = findByType(tree, JsonPathPanelResultPreviewFrame)[0];
    const list = findByType(tree, JsonPathPanelResultPreviewList)[0];
    const messages = findByType(tree, JsonPathPanelResultPreviewMessages)[0];

    expect(frame.props.onWheel).toBe(onWheel);
    expect(list.props).toMatchObject({
      previewItems,
      currentResultIndex: 2,
      showLocateStructure: true,
    });
    expect(messages.props).toMatchObject({
      hiddenResultCount: 4,
      maxVisibleResultCount: 5,
      copiedResultCount: 9,
      isResultLimited: true,
      resultLimit: 500,
    });
  });
});
