import { describe, expect, it, vi } from 'vitest';
import { formatPrimaryCmdHandlerCompatibleResult } from './schemeMetadata';
import { parseSchemeMetadataContext } from './schemeMetadataContext';

describe('schemeMetadataContext', () => {
  it('区分非法 JSON 与合法 null', () => {
    expect(parseSchemeMetadataContext('{bad json}')).toBeNull();
    expect(parseSchemeMetadataContext('{"value":1e400}')).toBeNull();
    expect(parseSchemeMetadataContext('null')).toMatchObject({
      decoded: 'null',
      decodedValue: null,
      sourceShape: null,
      rawJsonSource: null,
    });
  });

  it('解码值与 JSON 来源各只解析一次', () => {
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'feed',
      },
    });
    const source = JSON.stringify({
      panel_scheme:
        'sampleapp://v1/panel?target=sampleapp%3A%2F%2Fv1%2Fdetail%3Ffrom%3Dfeed',
    });
    const parseSpy = vi.spyOn(JSON, 'parse');

    try {
      const context = parseSchemeMetadataContext(decoded, source);

      expect(context?.source).toBe(source);
      expect(
        parseSpy.mock.calls.filter(([value]) => value === decoded),
      ).toHaveLength(1);
      expect(
        parseSpy.mock.calls.filter(([value]) => value === source),
      ).toHaveLength(1);
    } finally {
      parseSpy.mockRestore();
    }
  });

  it('主命令格式化回退复用同一解码上下文', () => {
    const decoded = JSON.stringify({
      from: 'feed',
    });
    const parseSpy = vi.spyOn(JSON, 'parse');

    try {
      expect(JSON.parse(
        formatPrimaryCmdHandlerCompatibleResult(decoded),
      )).toEqual({
        result: {
          cmdParams: {
            from: 'feed',
          },
        },
      });
      expect(
        parseSpy.mock.calls.filter(([value]) => value === decoded),
      ).toHaveLength(1);
    } finally {
      parseSpy.mockRestore();
    }
  });
});
