import { describe, expect, it, vi } from 'vitest';
import {
  isFiniteNumber,
  isRecord,
  parseJsonWithFallback,
  safeGetStorageItem,
  safeRemoveStorageItem,
  safeSetStorageItem,
} from './storage';

describe('parseJsonWithFallback', () => {
  it('解析合法 JSON', () => {
    expect(parseJsonWithFallback('{"enabled":true}', { enabled: false })).toEqual({ enabled: true });
  });

  it('空值或损坏 JSON 返回默认值', () => {
    const fallback = { enabled: false };

    expect(parseJsonWithFallback(null, fallback)).toBe(fallback);
    expect(parseJsonWithFallback('{bad', fallback)).toBe(fallback);
  });

  it('结构校验失败时返回默认值', () => {
    const fallback = { enabled: false };

    expect(parseJsonWithFallback('null', fallback, isRecord)).toBe(fallback);
  });
});

describe('storage guards', () => {
  it('识别普通对象', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });

  it('识别有限数字', () => {
    expect(isFiniteNumber(1)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
  });
});

describe('safe storage writes', () => {
  it('写入和删除成功时返回 true', () => {
    const storage = new Map<string, string>();
    const mockStorage = {
      get length() {
        return storage.size;
      },
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      removeItem: (key: string) => {
        storage.delete(key);
      },
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    } satisfies Storage;

    expect(safeSetStorageItem('key', 'value', mockStorage)).toBe(true);
    expect(storage.get('key')).toBe('value');
    expect(safeRemoveStorageItem('key', mockStorage)).toBe(true);
    expect(storage.has('key')).toBe(false);
  });

  it('浏览器禁止本地存储时吞掉异常并返回 false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const blockedStorage = {
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(safeSetStorageItem('key', 'value', blockedStorage)).toBe(false);
    expect(safeRemoveStorageItem('key', blockedStorage)).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });
});

describe('safe storage reads', () => {
  it('读取成功时返回存储内容', () => {
    const storage = {
      getItem: (key: string) => key === 'key' ? 'value' : null,
    } as unknown as Storage;

    expect(safeGetStorageItem('key', storage)).toBe('value');
    expect(safeGetStorageItem('missing', storage)).toBeNull();
  });

  it('浏览器禁止读取本地存储时吞掉异常并返回 null', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const blockedStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(safeGetStorageItem('key', blockedStorage)).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
