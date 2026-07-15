import { describe, expect, it } from 'vitest';
import { AIProvider } from '../types';
import {
  AI_CONFIG_STORAGE_KEY,
  GENERAL_SETTINGS_STORAGE_KEY,
} from './appSettings';
import {
  APP_BACKUP_APP_ID,
  APP_BACKUP_VERSION,
  applyAppBackupContent,
  buildAppBackup,
} from './appBackup';
import {
  JSON_SCHEMA_LIBRARY_STORAGE_KEY,
  createJsonSchemaLibraryItem,
  serializeJsonSchemaLibrary,
} from './jsonSchemaLibrary';
import { JSON_TREE_SEARCH_HISTORY_STORAGE_KEY } from './jsonTreeSearchHistory';
import { MemoryStorage } from './memoryStorageTestHelper';
import { DEFAULT_SHORTCUTS } from './shortcuts';

const currentAIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: 'current-key',
  model: 'current-model',
};

class ReadFailingStorage extends MemoryStorage {
  constructor(
    private readonly failingKey: string,
    private readonly readError: Error,
  ) {
    super();
  }

  override getItem(key: string): string | null {
    if (key === this.failingKey) throw this.readError;
    return super.getItem(key);
  }
}

const createLegacyV1Backup = (): string => JSON.stringify({
  app: APP_BACKUP_APP_ID,
  version: APP_BACKUP_VERSION,
  exportedAt: '2026-06-05T00:00:00.000Z',
  settings: {
    general: { autoExpandSchemeInDeepFormat: true },
    ai: {
      provider: AIProvider.CUSTOM,
      apiKey: '',
      model: 'legacy-model',
      baseUrl: '/legacy-ai',
    },
    shortcuts: DEFAULT_SHORTCUTS,
  },
  jsonPath: {
    history: ['$.legacy'],
    favorites: ['$.legacy.id'],
  },
  templateFill: {
    template: '{"legacy":true}',
    lastUpdated: 1,
  },
  panelLayout: {
    'jsonpath-panel': {
      position: { x: 10, y: 20 },
    },
  },
});

describe('配置备份完整性', () => {
  it('任一存储项读取失败时终止导出而不生成残缺备份', () => {
    const readError = new Error('读取 Schema 收藏失败');
    const storage = new ReadFailingStorage(JSON_SCHEMA_LIBRARY_STORAGE_KEY, readError);

    expect(() => buildAppBackup({
      storage,
      generalSettings: { autoExpandSchemeInDeepFormat: true },
      aiConfig: currentAIConfig,
      shortcuts: DEFAULT_SHORTCUTS,
    })).toThrow(readError);
  });

  it('拒绝只有身份字段的截断备份且不修改现有配置', () => {
    const storage = new MemoryStorage();
    storage.setItem(GENERAL_SETTINGS_STORAGE_KEY, '{"existing":true}');
    storage.setItem(AI_CONFIG_STORAGE_KEY, '{"model":"existing-model"}');

    expect(() => applyAppBackupContent(JSON.stringify({
      app: APP_BACKUP_APP_ID,
      version: APP_BACKUP_VERSION,
    }), storage, currentAIConfig)).toThrow('备份文件缺少必要配置');

    expect(storage.length).toBe(2);
    expect(storage.getItem(GENERAL_SETTINGS_STORAGE_KEY)).toBe('{"existing":true}');
    expect(storage.getItem(AI_CONFIG_STORAGE_KEY)).toBe('{"model":"existing-model"}');
  });

  it('导入早期 v1 时保留当时尚不存在的资产和面板布局', () => {
    const storage = new MemoryStorage();
    const schemaLibrary = serializeJsonSchemaLibrary([
      createJsonSchemaLibraryItem('{"title":"现有 Schema","type":"object"}', 1)!,
    ]);
    const structureHistory = JSON.stringify(['existing-query']);
    const jsonSchemaPosition = JSON.stringify({ x: 30, y: 40 });
    const structureSize = JSON.stringify({ width: 620, height: 440 });
    const comparePosition = JSON.stringify({ x: 50, y: 60 });

    storage.setItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY, schemaLibrary);
    storage.setItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY, structureHistory);
    storage.setItem('json-schema-panel-position', jsonSchemaPosition);
    storage.setItem('structure-nav-panel-size', structureSize);
    storage.setItem('json-compare-panel-position', comparePosition);
    storage.setItem('scheme-panel-position', JSON.stringify({ x: 70, y: 80 }));

    applyAppBackupContent(createLegacyV1Backup(), storage, currentAIConfig);

    expect(storage.getItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY)).toBe(schemaLibrary);
    expect(storage.getItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY)).toBe(structureHistory);
    expect(storage.getItem('json-schema-panel-position')).toBe(jsonSchemaPosition);
    expect(storage.getItem('structure-nav-panel-size')).toBe(structureSize);
    expect(storage.getItem('json-compare-panel-position')).toBe(comparePosition);
    expect(storage.getItem('scheme-panel-position')).toBeNull();
    expect(JSON.parse(storage.getItem('jsonpath-panel-position') || '{}')).toEqual({ x: 10, y: 20 });
  });

  it('过渡版 v1 显式携带后增面板时恢复该面板的完整布局', () => {
    const storage = new MemoryStorage();
    const payload = JSON.parse(createLegacyV1Backup()) as Record<string, unknown>;
    const panelLayout = payload.panelLayout as Record<string, unknown>;
    panelLayout['json-schema-panel'] = {
      position: { x: 90, y: 100 },
    };
    storage.setItem('json-schema-panel-size', JSON.stringify({ width: 800, height: 600 }));

    applyAppBackupContent(JSON.stringify(payload), storage, currentAIConfig);

    expect(JSON.parse(storage.getItem('json-schema-panel-position') || '{}'))
      .toEqual({ x: 90, y: 100 });
    expect(storage.getItem('json-schema-panel-size')).toBeNull();
  });

  it('Schema 能力标记只接管对应资产和面板', () => {
    const storage = new MemoryStorage();
    const payload = JSON.parse(createLegacyV1Backup()) as Record<string, unknown>;
    payload.jsonSchema = { library: [] };
    storage.setItem('json-schema-panel-position', '{"x":1,"y":2}');
    storage.setItem('structure-nav-panel-position', '{"x":3,"y":4}');

    applyAppBackupContent(JSON.stringify(payload), storage, currentAIConfig);

    expect(storage.getItem('json-schema-panel-position')).toBeNull();
    expect(storage.getItem('structure-nav-panel-position')).toBe('{"x":3,"y":4}');
  });

  it('拒绝不可能由历史生产者生成的能力组合且保持零写入', () => {
    const storage = new MemoryStorage();
    const payload = JSON.parse(createLegacyV1Backup()) as Record<string, unknown>;
    payload.structureNav = { searchHistory: [] };
    storage.setItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY, '["existing-query"]');

    expect(() => applyAppBackupContent(
      JSON.stringify(payload),
      storage,
      currentAIConfig,
    )).toThrow('备份文件缺少必要配置');

    expect(storage.length).toBe(1);
    expect(storage.getItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY)).toBe('["existing-query"]');
  });

  it('拒绝畸形面板布局且不把格式错误解释为清空', () => {
    const storage = new MemoryStorage();
    const payload = JSON.parse(createLegacyV1Backup()) as Record<string, unknown>;
    payload.panelLayout = {
      'jsonpath-panel': {
        position: { x: 'invalid', y: 20 },
      },
    };
    storage.setItem('jsonpath-panel-position', JSON.stringify({ x: 1, y: 2 }));

    expect(() => applyAppBackupContent(
      JSON.stringify(payload),
      storage,
      currentAIConfig,
    )).toThrow('备份文件缺少必要配置');

    expect(storage.length).toBe(1);
    expect(storage.getItem('jsonpath-panel-position')).toBe('{"x":1,"y":2}');
  });
});
