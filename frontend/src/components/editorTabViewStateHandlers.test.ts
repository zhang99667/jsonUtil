import { describe, expect, it, vi } from 'vitest';
import {
  buildEditorTabViewStateHandlers,
  saveActiveEditorViewState,
} from './editorTabViewStateHandlers';

const viewState = { cursorState: [{ position: { lineNumber: 8, column: 3 } }] };

describe('editorTabViewStateHandlers', () => {
  it('切换到其他 Tab 前保存当前 Tab 的 Monaco viewState', () => {
    const onSaveViewState = vi.fn();
    const onTabClick = vi.fn();
    const handlers = buildEditorTabViewStateHandlers({
      activeFileId: 'tab-1',
      saveEditorViewState: vi.fn(() => viewState),
      onSaveViewState,
      onTabClick,
    });

    handlers.handleTabClick('tab-2');

    expect(onSaveViewState).toHaveBeenCalledWith('tab-1', viewState);
    expect(onTabClick).toHaveBeenCalledWith('tab-2');
  });

  it('点击当前 Tab 不重复保存 viewState', () => {
    const onSaveViewState = vi.fn();
    const onTabClick = vi.fn();
    const handlers = buildEditorTabViewStateHandlers({
      activeFileId: 'tab-1',
      saveEditorViewState: vi.fn(() => viewState),
      onSaveViewState,
      onTabClick,
    });

    handlers.handleTabClick('tab-1');

    expect(onSaveViewState).not.toHaveBeenCalled();
    expect(onTabClick).toHaveBeenCalledWith('tab-1');
  });

  it('关闭当前 Tab 或新建 Tab 前保存当前 viewState', () => {
    const onSaveViewState = vi.fn();
    const onCloseFile = vi.fn();
    const onNewTab = vi.fn();
    const handlers = buildEditorTabViewStateHandlers({
      activeFileId: 'tab-1',
      saveEditorViewState: vi.fn(() => viewState),
      onSaveViewState,
      onCloseFile,
      onNewTab,
    });

    handlers.handleCloseFile('tab-2');
    expect(onSaveViewState).not.toHaveBeenCalled();
    expect(onCloseFile).toHaveBeenCalledWith('tab-2');

    handlers.handleCloseFile('tab-1');
    handlers.handleNewTab();

    expect(onSaveViewState).toHaveBeenNthCalledWith(1, 'tab-1', viewState);
    expect(onSaveViewState).toHaveBeenNthCalledWith(2, 'tab-1', viewState);
    expect(onCloseFile).toHaveBeenCalledWith('tab-1');
    expect(onNewTab).toHaveBeenCalledTimes(1);
  });

  it('缺少活动 Tab、保存回调或 viewState 时不写入状态', () => {
    expect(saveActiveEditorViewState({
      activeFileId: null,
      saveEditorViewState: vi.fn(() => viewState),
      onSaveViewState: vi.fn(),
    })).toBe(false);

    expect(saveActiveEditorViewState({
      activeFileId: 'tab-1',
      saveEditorViewState: vi.fn(() => viewState),
    })).toBe(false);

    const onSaveViewState = vi.fn();
    expect(saveActiveEditorViewState({
      activeFileId: 'tab-1',
      saveEditorViewState: vi.fn(() => null),
      onSaveViewState,
    })).toBe(false);
    expect(onSaveViewState).not.toHaveBeenCalled();
  });
});
