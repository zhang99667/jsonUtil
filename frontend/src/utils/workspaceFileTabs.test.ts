import { describe, expect, it } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import {
  getNextUntitledName,
  getWorkspaceTabCloseResult,
} from './workspaceFileTabs';

const createFile = (id: string, name = `${id}.json`): FileTab => ({
  id,
  name,
  content: id,
  savedContent: id,
  isDirty: false,
  mode: TransformMode.NONE,
});

describe('workspaceFileTabs', () => {
  it('从 Untitled 编号空洞里选择最小可用编号', () => {
    expect(getNextUntitledName([
      { name: 'Untitled-1' },
      { name: 'data.json' },
      { name: 'Untitled-3' },
    ])).toBe('Untitled-2');
  });

  it('关闭中间标签后选择右侧标签', () => {
    const result = getWorkspaceTabCloseResult([
      createFile('left'),
      createFile('active'),
      createFile('right'),
    ], 'active');

    expect(result?.remainingFiles.map(file => file.id)).toEqual(['left', 'right']);
    expect(result?.nextActiveFile?.id).toBe('right');
  });

  it('关闭最后一个标签后选择左侧标签', () => {
    const result = getWorkspaceTabCloseResult([
      createFile('left'),
      createFile('active'),
    ], 'active');

    expect(result?.remainingFiles.map(file => file.id)).toEqual(['left']);
    expect(result?.nextActiveFile?.id).toBe('left');
  });

  it('关闭不存在的标签时返回空结果', () => {
    expect(getWorkspaceTabCloseResult([createFile('left')], 'missing')).toBeNull();
  });
});
