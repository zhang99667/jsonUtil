import { describe, expect, it } from 'vitest';
import type { FileTab } from '../types';
import { buildStatusBarFileState, getStatusBarActiveFile } from './statusBarFileState';

const savedFile: FileTab = {
  id: 'file-1',
  name: 'demo.json',
  content: '{"ok":true}',
  handle: {} as FileSystemFileHandle,
  isDirty: true,
};

describe('statusBarFileState', () => {
  it('按 activeFileId 查找当前文件', () => {
    expect(getStatusBarActiveFile('file-1', [savedFile])).toBe(savedFile);
    expect(getStatusBarActiveFile('missing', [savedFile])).toBeNull();
    expect(getStatusBarActiveFile(null, [savedFile])).toBeNull();
  });

  it('从当前文件生成保存状态', () => {
    const state = buildStatusBarFileState({
      activeFileId: 'file-1',
      files: [savedFile],
      inputLength: 12,
      isAutoSaveEnabled: true,
    });

    expect(state.activeFile).toBe(savedFile);
    expect(state.saveStatus).toMatchObject({
      label: '等待自动保存',
      title: '自动保存会在编辑停止后写入文件',
    });
  });

  it('当前文件缺失时按草稿状态处理', () => {
    const state = buildStatusBarFileState({
      activeFileId: 'missing',
      files: [savedFile],
      inputLength: 0,
      isAutoSaveEnabled: false,
    });

    expect(state.activeFile).toBeNull();
    expect(state.saveStatus).toMatchObject({ label: '空白草稿' });
  });
});
