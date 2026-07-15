import { describe, expect, it } from 'vitest';
import { FileTab, TransformMode } from '../types';
import {
  buildWorkspaceDraftSnapshot,
  parseWorkspaceDraftSnapshot,
  saveWorkspaceDraftSnapshot,
  WORKSPACE_DRAFT_STORAGE_KEY,
} from './workspaceDraft';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    storage: {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => {
        values.delete(key);
      },
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    } satisfies Storage,
    values,
  };
};

describe('workspaceDraft', () => {
  it('仅保存有未保存修改的标签', () => {
    const files: FileTab[] = [
      {
        id: 'clean',
        name: 'clean.json',
        content: '{"clean":true}',
        savedContent: '{"clean":true}',
        isDirty: false,
      },
      {
        id: 'dirty',
        name: 'dirty.json',
        content: '{"dirty":true}',
        savedContent: '{"dirty":false}',
        isDirty: true,
        mode: TransformMode.FORMAT,
        path: '/tmp/dirty.json',
      },
    ];

    const snapshot = buildWorkspaceDraftSnapshot({
      files,
      activeFileId: 'dirty',
      standaloneInput: '',
      standaloneMode: TransformMode.NONE,
      now: () => 123,
    });

    expect(snapshot).toMatchObject({
      updatedAt: 123,
      activeFileId: 'dirty',
    });
    expect(snapshot?.files).toEqual([
      expect.objectContaining({
        id: 'dirty',
        name: 'dirty.json',
        content: '{"dirty":true}',
        savedContent: '{"dirty":false}',
        isDirty: true,
        mode: TransformMode.FORMAT,
        path: '/tmp/dirty.json',
        handle: undefined,
      }),
    ]);
  });

  it('保存无文件草稿并在解析时恢复模式', () => {
    const snapshot = buildWorkspaceDraftSnapshot({
      files: [],
      activeFileId: null,
      standaloneInput: '{"draft":true}',
      standaloneMode: TransformMode.DEEP_FORMAT,
      now: () => 456,
    });

    const parsed = parseWorkspaceDraftSnapshot(JSON.stringify(snapshot));

    expect(parsed).toMatchObject({
      activeFileId: null,
      standaloneInput: '{"draft":true}',
      standaloneMode: TransformMode.DEEP_FORMAT,
    });
    expect(parsed?.files).toEqual([]);
  });

  it('解析脏标签时不会恢复文件句柄并保留未保存状态', () => {
    const parsed = parseWorkspaceDraftSnapshot(JSON.stringify({
      version: 1,
      updatedAt: 1,
      activeFileId: 'file-1',
      standaloneInput: '',
      standaloneMode: TransformMode.NONE,
      files: [{
        id: 'file-1',
        name: 'opened.json',
        content: '{"changed":true}',
        savedContent: '{"changed":false}',
        mode: TransformMode.MINIFY,
        path: '/tmp/opened.json',
        handle: { fake: true },
      }],
    }));

    expect(parsed?.activeFileId).toBe('file-1');
    expect(parsed?.files[0]).toMatchObject({
      handle: undefined,
      isDirty: true,
      mode: TransformMode.MINIFY,
    });
  });

  it('空快照和损坏内容返回 null', () => {
    expect(parseWorkspaceDraftSnapshot(null)).toBeNull();
    expect(parseWorkspaceDraftSnapshot('{bad')).toBeNull();
    expect(parseWorkspaceDraftSnapshot(JSON.stringify({ version: 1, files: [] }))).toBeNull();
  });

  it('保存 null 时会清理本地快照', () => {
    const { storage, values } = createStorage();
    values.set(WORKSPACE_DRAFT_STORAGE_KEY, '{"old":true}');

    expect(saveWorkspaceDraftSnapshot(null, storage)).toBe(true);
    expect(values.has(WORKSPACE_DRAFT_STORAGE_KEY)).toBe(false);
  });

  it.each([
    ['预估', 'x'.repeat(10_001), 10_000],
    ['序列化', '\\"'.repeat(750), 2_600],
  ])('%s超限时保留最后一份成功快照', (_, standaloneInput, maxStorageChars) => {
    const { storage, values } = createStorage();
    values.set(WORKSPACE_DRAFT_STORAGE_KEY, '{"old":true}');

    const snapshot = buildWorkspaceDraftSnapshot({
      files: [],
      activeFileId: null,
      standaloneInput,
      standaloneMode: TransformMode.NONE,
      now: () => 789,
    });

    expect(saveWorkspaceDraftSnapshot(snapshot, storage, maxStorageChars)).toBe(false);
    expect(values.get(WORKSPACE_DRAFT_STORAGE_KEY)).toBe('{"old":true}');
  });

  it('草稿体积在上限内时会写入本地存储', () => {
    const { storage, values } = createStorage();
    const snapshot = buildWorkspaceDraftSnapshot({
      files: [],
      activeFileId: null,
      standaloneInput: '{"draft":true}',
      standaloneMode: TransformMode.NONE,
      now: () => 789,
    });

    expect(saveWorkspaceDraftSnapshot(snapshot, storage, 10_000)).toBe(true);
    expect(JSON.parse(values.get(WORKSPACE_DRAFT_STORAGE_KEY) || '{}')).toMatchObject({
      standaloneInput: '{"draft":true}',
    });
  });
});
