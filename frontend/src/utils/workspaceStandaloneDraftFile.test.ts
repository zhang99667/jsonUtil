import { describe, expect, it, vi } from 'vitest';
import { TransformMode, type FileTab } from '../types';
import { getFilesWithStandaloneDraft } from './workspaceStandaloneDraftFile';

const createFile = (id: string, name = `${id}.json`): FileTab => ({
  id,
  name,
  content: id,
  savedContent: id,
  isDirty: false,
  mode: TransformMode.NONE,
});

describe('workspaceStandaloneDraftFile', () => {
  it.each([
    ['已有活动标签', 'file-1', '{"draft":true}'],
    ['空输入', null, ''],
  ])('%s时不创建草稿标签', (_caseName, activeFileId, input) => {
    const files = [createFile('file-1')];
    const createId = vi.fn(() => 'draft-id');

    expect(getFilesWithStandaloneDraft({
      files,
      activeFileId,
      input,
      createId,
    })).toBe(files);
    expect(createId).not.toHaveBeenCalled();
  });

  it('无活动标签且有输入时追加未保存 Untitled 草稿', () => {
    const files = [
      createFile('file-1', 'Untitled-1'),
      createFile('file-2', 'Untitled-3'),
    ];

    const nextFiles = getFilesWithStandaloneDraft({
      files,
      activeFileId: null,
      input: '{"draft":true}',
      createId: () => 'draft-id',
    });

    expect(nextFiles).toHaveLength(3);
    expect(nextFiles[2]).toMatchObject({
      id: 'draft-id',
      name: 'Untitled-2',
      content: '{"draft":true}',
      savedContent: '',
      isDirty: true,
      mode: TransformMode.NONE,
    });
  });
});
