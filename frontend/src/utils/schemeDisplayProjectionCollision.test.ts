import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addSchemeDisplayProjectionHeader,
  buildSchemeDisplayProjection,
  createSchemeDecodeDisplayContext,
} from './schemeDisplayProjection';

describe('Scheme 协议头投影标记', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('原生随机标识不可用时复用安全随机字节降级', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(1);
      return bytes;
    });
    vi.stubGlobal('crypto', { getRandomValues });
    expect(createSchemeDecodeDisplayContext().displayHeaderNonce).toBe(
      '01010101-0101-4101-8101-010101010101',
    );
  });

  it('内部事件唯一时允许后续递归继续修改子字段', () => {
    const context = createSchemeDecodeDisplayContext();
    const value = addSchemeDisplayProjectionHeader(
      { id: 1 },
      'sampleapp://v1/item/open?id=1',
      [],
      context,
    );
    expect(value).not.toBeNull();
    expect(Array.isArray(value)).toBe(false);
    expect(typeof value).toBe('object');
    if (!value || Array.isArray(value) || typeof value !== 'object') return;

    const projection = buildSchemeDisplayProjection(
      JSON.stringify({ ...value, id: 2 }),
      context,
    );

    expect(JSON.parse(projection?.displayDecoded ?? 'null')).toEqual({
      __scheme__: 'sampleapp://v1/item/open',
      id: 2,
    });
  });

  it('业务后代沿用旧内部键和协议头值时仍完整投影', () => {
    const context = createSchemeDecodeDisplayContext();
    const rootSource = 'samplevendor://v1/outer/open?next=encoded';
    const rootHeader = 'samplevendor://v1/outer/open';
    const nestedSource = 'sampleapp://v2/inner/open?id=1';
    const nestedHeader = 'sampleapp://v2/inner/open';
    const nestedValue = addSchemeDisplayProjectionHeader(
      {
        __scheme_display_event_1__: rootHeader,
        id: 1,
      },
      nestedSource,
      [],
      context,
    );
    const value = addSchemeDisplayProjectionHeader(
      {
        next: nestedValue,
        scene: 'feed',
      },
      rootSource,
      [],
      context,
    );
    const projection = buildSchemeDisplayProjection(JSON.stringify(value), context);
    const businessValue = JSON.parse(projection?.businessDecoded ?? 'null');
    const displayValue = JSON.parse(projection?.displayDecoded ?? 'null');

    expect(businessValue).toEqual({
      next: {
        __scheme_display_event_1__: rootHeader,
        id: 1,
      },
      scene: 'feed',
    });
    expect(displayValue).toEqual({
      __scheme__: rootHeader,
      next: {
        __scheme__: nestedHeader,
        __scheme_display_event_1__: rootHeader,
        id: 1,
      },
      scene: 'feed',
    });
    expect(projection?.headers.map(header => header.path)).toEqual(['', '/next']);
    for (const event of context.displayHeaderEvents) {
      expect(projection?.businessDecoded).not.toContain(event.internalValue);
      expect(projection?.displayDecoded).not.toContain(event.internalValue);
    }
  });

  it('事件生成后出现同级确定性标记碰撞时仍完整投影', () => {
    const context = createSchemeDecodeDisplayContext();
    const nestedValue = addSchemeDisplayProjectionHeader(
      { id: 1 },
      'sampleapp://v2/inner/open?id=1',
      [],
      context,
    );
    const value = addSchemeDisplayProjectionHeader(
      {
        next: nestedValue,
        business: {
          __scheme_display_event_0__: '__scheme_display_marker_0__',
        },
      },
      'samplevendor://v1/outer/open?next=encoded',
      [],
      context,
    );
    const projection = buildSchemeDisplayProjection(JSON.stringify(value), context);

    expect(JSON.parse(projection?.displayDecoded ?? 'null')).toEqual({
      __scheme__: 'samplevendor://v1/outer/open',
      next: {
        __scheme__: 'sampleapp://v2/inner/open',
        id: 1,
      },
      business: {
        __scheme_display_event_0__: '__scheme_display_marker_0__',
      },
    });
    expect(projection?.headers.map(header => header.path)).toEqual(['', '/next']);
  });

  it('真实节点变化且内部标记重复时安全拒绝投影', () => {
    const context = createSchemeDecodeDisplayContext();
    const value = addSchemeDisplayProjectionHeader(
      { id: 1 },
      'sampleapp://v1/item/open?id=1',
      [],
      context,
    );
    expect(value).not.toBeNull();
    expect(Array.isArray(value)).toBe(false);
    expect(typeof value).toBe('object');
    if (!value || Array.isArray(value) || typeof value !== 'object') return;

    expect(buildSchemeDisplayProjection(
      JSON.stringify([{ ...value, id: 2 }, value]),
      context,
    )).toBeNull();
  });
});
