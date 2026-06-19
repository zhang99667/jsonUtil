import { describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import {
  APP_BACKUP_IMPORTED_EVENT,
  APP_BACKUP_APP_ID,
  APP_BACKUP_VERSION,
  applyAppBackupContent,
  buildAppBackup,
  notifyAppBackupImported,
  serializeAppBackup,
} from './appBackup';
import {
  JSON_SCHEMA_LIBRARY_STORAGE_KEY,
  createJsonSchemaLibraryItem,
  serializeJsonSchemaLibrary,
} from './jsonSchemaLibrary';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length() {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('app backup', () => {
  it('构建配置备份时不导出 AI Key', () => {
    const storage = new MemoryStorage();
    storage.setItem('jsonpath-query-favorites', JSON.stringify(['$.users[*].name']));
    storage.setItem('json-helper-template-fill', JSON.stringify({
      template: '{"env":"test"}',
      lastUpdated: 1,
    }));
    storage.setItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY, serializeJsonSchemaLibrary([
      createJsonSchemaLibraryItem('{"title":"订单响应","type":"object"}', 1)!,
    ]));
    storage.setItem('jsonpath-panel-position', JSON.stringify({ x: 20, y: 40 }));
    storage.setItem('jsonpath-panel-size', JSON.stringify({ width: 620, height: 420 }));
    storage.setItem('structure-nav-panel-position', JSON.stringify({ x: 120, y: 80 }));

    const backup = buildAppBackup({
      storage,
      now: () => new Date('2026-06-05T00:00:00.000Z'),
      aiConfig: {
        provider: AIProvider.CUSTOM,
        apiKey: 'secret-key',
        model: 'custom-json-model',
        baseUrl: '/mock-ai',
      },
    });

    expect(backup.exportedAt).toBe('2026-06-05T00:00:00.000Z');
    expect(backup.settings.ai).toEqual({
      provider: AIProvider.CUSTOM,
      apiKey: '',
      model: 'custom-json-model',
      baseUrl: '/mock-ai',
    });
    expect(backup.jsonPath.favorites).toEqual(['$.users[*].name']);
    expect(backup.jsonSchema.library).toHaveLength(1);
    expect(backup.jsonSchema.library[0]).toMatchObject({
      name: '订单响应',
      schemaText: '{"title":"订单响应","type":"object"}',
    });
    expect(backup.templateFill.template).toBe('{"env":"test"}');
    expect(backup.panelLayout['jsonpath-panel']).toEqual({
      position: { x: 20, y: 40 },
      size: { width: 620, height: 420 },
    });
    expect(backup.panelLayout['structure-nav-panel']).toEqual({
      position: { x: 120, y: 80 },
    });
  });

  it('导入配置备份时保留当前 AI Key 并写入用户资产', () => {
    const storage = new MemoryStorage();
    const content = JSON.stringify({
      app: APP_BACKUP_APP_ID,
      version: APP_BACKUP_VERSION,
      exportedAt: '2026-06-05T00:00:00.000Z',
      settings: {
        general: { autoExpandSchemeInDeepFormat: true },
        ai: {
          provider: AIProvider.CUSTOM,
          apiKey: 'file-secret-key',
          model: 'imported-model',
          baseUrl: '/imported-ai',
        },
        shortcuts: {
          SAVE: { key: 's', meta: false, ctrl: true, shift: false, alt: false },
        },
      },
      jsonPath: {
        history: [' $.users ', '$.users', ''],
        favorites: ['$.users[*].name'],
      },
      jsonSchema: {
        library: [
          createJsonSchemaLibraryItem('{"title":"用户响应","type":"object"}', 3),
          { id: 'broken' },
        ],
      },
      templateFill: {
        template: '{"debug":true}',
        lastUpdated: 2,
      },
      panelLayout: {
        'jsonpath-panel': {
          position: { x: 50, y: 60 },
          size: { width: 640, height: 440 },
        },
      },
    });

    const result = applyAppBackupContent(content, storage, {
      provider: AIProvider.GEMINI,
      apiKey: 'current-key',
      model: 'old-model',
    });

    expect(result.aiConfig).toEqual({
      provider: AIProvider.CUSTOM,
      apiKey: 'current-key',
      model: 'imported-model',
      baseUrl: '/imported-ai',
    });
    expect(result.generalSettings.autoExpandSchemeInDeepFormat).toBe(true);
    expect(result.shortcuts.SAVE).toEqual({ key: 's', meta: false, ctrl: true, shift: false, alt: false });
    expect(JSON.parse(storage.getItem('json-helper-ai-config') || '{}').apiKey).toBe('current-key');
    expect(JSON.parse(storage.getItem('jsonpath-query-history') || '[]')).toEqual(['$.users']);
    expect(JSON.parse(storage.getItem('jsonpath-query-favorites') || '[]')).toEqual(['$.users[*].name']);
    expect(JSON.parse(storage.getItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY) || '[]')).toEqual([
      expect.objectContaining({
        name: '用户响应',
        schemaText: '{"title":"用户响应","type":"object"}',
      }),
    ]);
    expect(result.importedCounts.jsonSchemaLibrary).toBe(1);
    expect(JSON.parse(storage.getItem('json-helper-template-fill') || '{}').template).toBe('{"debug":true}');
    expect(JSON.parse(storage.getItem('jsonpath-panel-position') || '{}')).toEqual({ x: 50, y: 60 });
  });

  it('序列化备份文件保留可读缩进', () => {
    const storage = new MemoryStorage();
    const serialized = serializeAppBackup(buildAppBackup({ storage }));

    expect(serialized).toContain('\n  "app": "jsonutils-pro"');
    expect(serialized.endsWith('\n')).toBe(true);
  });

  it('广播导入事件', () => {
    const target = new EventTarget();
    const listener = vi.fn();

    target.addEventListener(APP_BACKUP_IMPORTED_EVENT, listener);
    notifyAppBackupImported(target);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
