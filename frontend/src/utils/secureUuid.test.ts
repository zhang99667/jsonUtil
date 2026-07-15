import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSecureUuid } from './secureUuid';

describe('createSecureUuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('优先使用浏览器原生随机标识生成方法', () => {
    const randomUUID = vi.fn(() => '00000000-0000-4000-8000-000000000000');
    vi.stubGlobal('crypto', { randomUUID });

    expect(createSecureUuid()).toBe('00000000-0000-4000-8000-000000000000');
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it('原生方法不可用时使用安全随机字节并设置版本位', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.forEach((_, index) => {
        bytes[index] = index;
      });
      return bytes;
    });
    vi.stubGlobal('crypto', { getRandomValues });

    expect(createSecureUuid()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });

  it('安全随机数能力缺失时明确失败', () => {
    vi.stubGlobal('crypto', {});

    expect(() => createSecureUuid()).toThrow('当前环境不支持安全随机数');
  });
});
