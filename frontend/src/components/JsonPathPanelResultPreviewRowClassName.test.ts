import { describe, expect, it } from 'vitest';
import { getJsonPathResultPreviewRowClassName } from './JsonPathPanelResultPreviewRowClassName';

describe('getJsonPathResultPreviewRowClassName', () => {
  it('保留结果预览行的基础布局类名', () => {
    expect(getJsonPathResultPreviewRowClassName(false)).toContain(
      'flex min-w-0 items-center gap-1 rounded border text-xs transition-colors'
    );
  });

  it('按选中态切换高亮和悬停类名', () => {
    expect(getJsonPathResultPreviewRowClassName(true)).toContain(
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
    );
    expect(getJsonPathResultPreviewRowClassName(false)).toContain(
      'border-transparent bg-editor-sidebar text-gray-300 hover:bg-editor-hover hover:text-gray-100'
    );
  });
});
