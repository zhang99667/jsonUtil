import { describe, expect, it } from 'vitest';
import { collectText } from './componentElementTestHelpers';
import { JsonPathPanelResultPreviewMessages } from './JsonPathPanelResultPreviewMessages';

const renderMessages = (
  overrides: Partial<Parameters<typeof JsonPathPanelResultPreviewMessages>[0]> = {}
) => JsonPathPanelResultPreviewMessages({
  hiddenResultCount: 0,
  maxVisibleResultCount: 5,
  copiedResultCount: 5,
  isResultLimited: false,
  resultLimit: 500,
  ...overrides,
});

describe('JsonPathPanelResultPreviewMessages', () => {
  it('无隐藏结果且未触发上限时不展示提示', () => {
    expect(collectText(renderMessages())).toBe('');
  });

  it('展示隐藏结果数量和命中上限提示', () => {
    const text = collectText(renderMessages({
      hiddenResultCount: 8,
      maxVisibleResultCount: 5,
      copiedResultCount: 20,
      isResultLimited: true,
      resultLimit: 500,
    }));

    expect(text).toContain('仅显示前 5 项，复制按钮可导出已返回的 20 项');
    expect(text).toContain('为保护性能，命中超过 500 项后已提前停止');
  });
});
