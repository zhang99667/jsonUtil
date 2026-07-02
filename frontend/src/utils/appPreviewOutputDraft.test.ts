import { describe, expect, it } from 'vitest';
import {
  beginPreviewOutputDraft,
  clearPreviewOutputDraft,
  keepPreviewOutputDraft,
} from './appPreviewOutputDraft';

const createDraftRefs = () => ({
  isUpdatingFromOutput: { current: false },
  pendingOutputValue: { current: '' },
});

describe('appPreviewOutputDraft', () => {
  it('开始 PREVIEW 草稿时标记回写中并保留草稿值', () => {
    const draft = createDraftRefs();

    beginPreviewOutputDraft(draft.isUpdatingFromOutput, draft.pendingOutputValue, '{"a":2}');

    expect(draft.isUpdatingFromOutput.current).toBe(true);
    expect(draft.pendingOutputValue.current).toBe('{"a":2}');
  });

  it('保留 PREVIEW 草稿时只更新草稿值', () => {
    const draft = createDraftRefs();
    draft.isUpdatingFromOutput.current = true;

    keepPreviewOutputDraft(draft.pendingOutputValue, '{bad');

    expect(draft.isUpdatingFromOutput.current).toBe(true);
    expect(draft.pendingOutputValue.current).toBe('{bad');
  });

  it('清理 PREVIEW 草稿时退出回写中状态并清空草稿', () => {
    const draft = createDraftRefs();
    draft.isUpdatingFromOutput.current = true;
    draft.pendingOutputValue.current = '{"a":2}';

    clearPreviewOutputDraft(draft.isUpdatingFromOutput, draft.pendingOutputValue);

    expect(draft.isUpdatingFromOutput.current).toBe(false);
    expect(draft.pendingOutputValue.current).toBe('');
  });
});
