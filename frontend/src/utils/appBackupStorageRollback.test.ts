import { describe, expect, it } from 'vitest';
import { AIProvider } from '../types';
import { AI_CONFIG_STORAGE_KEY, GENERAL_SETTINGS_STORAGE_KEY, TEMPLATE_FILL_STORAGE_KEY } from './appSettings';
import { APP_BACKUP_APP_ID, APP_BACKUP_VERSION, applyAppBackupContent } from './appBackup';
import { JSONPATH_FAVORITES_STORAGE_KEY, JSONPATH_HISTORY_STORAGE_KEY } from './jsonPathLists';
import { JSON_SCHEMA_LIBRARY_STORAGE_KEY } from './jsonSchemaLibrary';
import { JSON_TREE_SEARCH_HISTORY_STORAGE_KEY } from './jsonTreeSearchHistory';
import { MemoryStorage } from './memoryStorageTestHelper';
import { SHORTCUTS_STORAGE_KEY } from './shortcuts';

interface StorageOperation {
  method: 'setItem' | 'removeItem';
  key: string;
}

interface StorageFailurePlan {
  mutationFailures?: ReadonlyMap<number, Error>;
  readFailure?: { index: number; error: Error };
}

class FaultInjectingStorage extends MemoryStorage {
  private mutationFailures = new Map<number, Error>();
  private readFailure?: { index: number; error: Error };
  private mutationCount = 0;
  private readCount = 0;
  readonly operations: StorageOperation[] = [];

  arm({ mutationFailures, readFailure }: StorageFailurePlan = {}): void {
    this.mutationFailures = new Map(mutationFailures);
    this.readFailure = readFailure;
    this.mutationCount = 0;
    this.readCount = 0;
    this.operations.length = 0;
  }

  override getItem(key: string): string | null {
    const index = this.readCount;
    this.readCount += 1;
    if (this.readFailure?.index === index) {
      const { error } = this.readFailure;
      this.readFailure = undefined;
      throw error;
    }
    return super.getItem(key);
  }

  override removeItem(key: string): void {
    this.beforeMutation('removeItem', key);
    super.removeItem(key);
  }

  override setItem(key: string, value: string): void {
    this.beforeMutation('setItem', key);
    super.setItem(key, value);
  }

  private beforeMutation(method: StorageOperation['method'], key: string): void {
    const index = this.mutationCount;
    this.mutationCount += 1;
    this.operations.push({ method, key });
    const error = this.mutationFailures.get(index);
    if (error) {
      // 标准 Web Storage 变更失败时不会提交该次操作，故故障在实际写入前抛出。
      this.mutationFailures.delete(index);
      throw error;
    }
  }
}

const EXPECTED_FORWARD_OPERATIONS: readonly StorageOperation[] = [
  { method: 'setItem', key: GENERAL_SETTINGS_STORAGE_KEY },
  { method: 'setItem', key: AI_CONFIG_STORAGE_KEY },
  { method: 'setItem', key: SHORTCUTS_STORAGE_KEY },
  { method: 'setItem', key: JSONPATH_HISTORY_STORAGE_KEY },
  { method: 'setItem', key: JSONPATH_FAVORITES_STORAGE_KEY },
  { method: 'setItem', key: JSON_SCHEMA_LIBRARY_STORAGE_KEY },
  { method: 'setItem', key: JSON_TREE_SEARCH_HISTORY_STORAGE_KEY },
  { method: 'setItem', key: TEMPLATE_FILL_STORAGE_KEY },
  { method: 'setItem', key: 'jsonpath-panel-position' },
  { method: 'setItem', key: 'jsonpath-panel-size' },
  { method: 'removeItem', key: 'json-compare-panel-position' },
  { method: 'removeItem', key: 'json-compare-panel-size' },
  { method: 'removeItem', key: 'structure-nav-panel-position' },
  { method: 'removeItem', key: 'structure-nav-panel-size' },
  { method: 'removeItem', key: 'json-schema-panel-position' },
  { method: 'removeItem', key: 'json-schema-panel-size' },
  { method: 'removeItem', key: 'scheme-panel-position' },
  { method: 'removeItem', key: 'scheme-panel-size' },
  { method: 'removeItem', key: 'template-fill-panel-position' },
  { method: 'removeItem', key: 'template-fill-panel-size' },
];

const MANAGED_STORAGE_KEYS = EXPECTED_FORWARD_OPERATIONS.map(operation => operation.key);

const BACKUP_CONTENT = JSON.stringify({
  app: APP_BACKUP_APP_ID,
  version: APP_BACKUP_VERSION,
  exportedAt: '2026-06-29T00:00:00.000Z',
  settings: {
    general: { autoExpandSchemeInDeepFormat: true },
    ai: { provider: AIProvider.CUSTOM, model: 'imported-model', baseUrl: '/imported-ai' },
    shortcuts: {},
  },
  jsonPath: { history: ['$.users'], favorites: ['$.users[*].name'] },
  jsonSchema: { library: [] },
  structureNav: { searchHistory: ['phone'] },
  templateFill: { template: '{"debug":true}', lastUpdated: 2 },
  panelLayout: {
    'jsonpath-panel': {
      position: { x: 50, y: 60 },
      size: { width: 640, height: 440 },
    },
  },
});

const importBackup = (storage: Storage) => applyAppBackupContent(BACKUP_CONTENT, storage, {
  provider: AIProvider.GEMINI,
  apiKey: 'current-key',
  model: 'current-model',
});

const seedStorage = (): FaultInjectingStorage => {
  const storage = new FaultInjectingStorage();
  const oldValues = ['', 'null', '{旧值'];
  MANAGED_STORAGE_KEYS.forEach((key, index) => {
    if (index % 4 !== 0) {
      storage.setItem(key, oldValues[index % oldValues.length]);
    }
  });
  storage.arm();
  return storage;
};

const snapshotStorage = (storage: Storage): Record<string, string | null> => (
  Object.fromEntries(MANAGED_STORAGE_KEYS.map(key => [key, storage.getItem(key)]))
);

const captureForwardOperations = (): StorageOperation[] => {
  const storage = seedStorage();
  importBackup(storage);
  return [...storage.operations];
};

const captureError = (run: () => void): unknown => {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('预期操作失败');
};

describe('配置备份存储补偿', () => {
  it('任一存储变更失败时都精确恢复原始数据', () => {
    const forwardOperations = captureForwardOperations();
    expect(MANAGED_STORAGE_KEYS).toHaveLength(20);
    expect(new Set(MANAGED_STORAGE_KEYS)).toHaveLength(20);
    expect(forwardOperations).toEqual(EXPECTED_FORWARD_OPERATIONS);

    forwardOperations.forEach((operation, index) => {
      const storage = seedStorage();
      const before = snapshotStorage(storage);
      const forwardError = new Error(`第 ${index + 1} 次存储变更失败`);
      storage.arm({ mutationFailures: new Map([[index, forwardError]]) });

      expect(() => importBackup(storage)).toThrow(forwardError);
      expect(storage.operations[index]).toEqual(operation);
      expect(snapshotStorage(storage)).toEqual(before);
    });
  });

  it('读取原值快照失败时不执行任何存储变更', () => {
    const storage = seedStorage();
    const before = snapshotStorage(storage);
    const readError = new Error('读取原值失败');
    storage.arm({ readFailure: { index: 5, error: readError } });

    expect(() => importBackup(storage)).toThrow(readError);
    expect(storage.operations).toHaveLength(0);
    expect(snapshotStorage(storage)).toEqual(before);
  });

  it('补偿失败时继续恢复其余键并明确报告部分变更', () => {
    const forwardOperations = captureForwardOperations();
    const storage = seedStorage();
    const before = snapshotStorage(storage);
    const forwardFailureIndex = 10;
    const rollbackFailureKey = forwardOperations[forwardFailureIndex - 1].key;
    const forwardError = new Error('前向变更失败');
    const rollbackError = new Error('补偿恢复失败');
    storage.arm({
      mutationFailures: new Map([
        [forwardFailureIndex, forwardError],
        [forwardFailureIndex + 1, rollbackError],
      ]),
    });

    const error = captureError(() => importBackup(storage));

    expect(error).toBeInstanceOf(AggregateError);
    expect((error as AggregateError).errors).toEqual([forwardError, rollbackError]);
    expect((error as Error).message).toContain('部分设置可能已变更');
    expect(storage.operations.length).toBeGreaterThan(forwardFailureIndex + 2);
    const after = snapshotStorage(storage);

    MANAGED_STORAGE_KEYS.forEach(key => {
      if (key === rollbackFailureKey) {
        expect(after[key]).not.toBe(before[key]);
        return;
      }
      expect(after[key]).toBe(before[key]);
    });
  });
});
