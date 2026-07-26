import { describe, expect, it, vi } from 'vitest';
import {
  extractBase64MetaInfo,
  extractSchemeCommandSummaryInfo,
} from './schemeMetadata';
import type { SchemeDecodeResult } from './schemeTypes';
import { buildSchemeViewerDecodeMetadata } from './schemeViewerDecodeMetadata';

describe('schemeViewerDecodeMetadata 解析复用', () => {
  it('聚合结果保持旧 API 语义且 decoded 与 source 各只解析一次', () => {
    const source = JSON.stringify({
      panel_scheme:
        'sampleapp://v1/panel?target=sampleapp%3A%2F%2Fv1%2Fdetail%3Ffrom%3Dfeed',
    });
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'feed',
      },
      _base64_suffix: 'b3M9Mg==',
      _base64_suffix_decoded: {
        os: '2',
      },
    });
    const result: SchemeDecodeResult = {
      original: source,
      decoded,
      layers: [],
      isJson: true,
    };
    const expected = {
      base64MetaInfo: extractBase64MetaInfo(decoded, true),
      commandSummaryInfo: extractSchemeCommandSummaryInfo(
        decoded,
        true,
        undefined,
        { source },
      ),
    };
    const parseSpy = vi.spyOn(JSON, 'parse');

    try {
      expect(buildSchemeViewerDecodeMetadata(result)).toEqual(expected);
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
});
