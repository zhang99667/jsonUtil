import { describe, expect, it } from 'vitest';
import type { FileTab } from '../types';
import {
  buildAppFileCloseDecision,
  getPendingAppCloseFile,
  hasAppFileUnsavedChanges,
} from './appFileCloseGuardState';

const createFile = (overrides: Partial<FileTab> = {}): FileTab => ({
  id: 'clean',
  name: 'clean.json',
  content: '{}',
  isDirty: false,
  ...overrides,
});

describe('appFileCloseGuardState', () => {
  it('存在脏文件或无活动标签 SOURCE 草稿时认为有未保存内容', () => {
    expect(hasAppFileUnsavedChanges({
      files: [createFile({ id: 'dirty', isDirty: true })],
      activeFileId: 'dirty',
      sourceText: '{}',
    })).toBe(true);
    expect(hasAppFileUnsavedChanges({
      files: [createFile()],
      activeFileId: null,
      sourceText: '  {"draft":true}  ',
    })).toBe(true);
  });

  it('活动标签存在且文件不脏时不把 SOURCE 文本单独当作草稿', () => {
    expect(hasAppFileUnsavedChanges({
      files: [createFile()],
      activeFileId: 'clean',
      sourceText: '{"clean":true}',
    })).toBe(false);
    expect(hasAppFileUnsavedChanges({
      files: [createFile()],
      activeFileId: null,
      sourceText: '   ',
    })).toBe(false);
  });

  it('根据 pending id 找到待确认关闭文件', () => {
    const files = [createFile(), createFile({ id: 'dirty', name: 'dirty.json' })];

    expect(getPendingAppCloseFile(files, 'dirty')?.name).toBe('dirty.json');
    expect(getPendingAppCloseFile(files, 'missing')).toBeNull();
    expect(getPendingAppCloseFile(files, null)).toBeNull();
  });

  it('为关闭请求生成 ignore、confirm 或 close 决策', () => {
    const files = [createFile(), createFile({ id: 'dirty', isDirty: true })];

    expect(buildAppFileCloseDecision(files, 'missing')).toEqual({ action: 'ignore' });
    expect(buildAppFileCloseDecision(files, 'dirty')).toEqual({ action: 'confirm', fileId: 'dirty' });
    expect(buildAppFileCloseDecision(files, 'clean')).toEqual({ action: 'close', fileId: 'clean' });
  });
});
