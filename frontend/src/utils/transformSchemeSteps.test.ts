import { describe, expect, it } from 'vitest';

import { base64Encode } from './schemeBase64Codec.ts';
import {
  buildSchemeParamStageSummary,
  decodeSchemeJsonStep,
} from './transformSchemeSteps.ts';

describe('buildSchemeParamStageSummary', () => {
  it('空分层返回 undefined，非空分层生成脱敏摘要和样本', () => {
    expect(buildSchemeParamStageSummary()).toBeUndefined();
    expect(buildSchemeParamStageSummary([])).toBeUndefined();

    const summary = buildSchemeParamStageSummary([
      {
        path: '$.cmd',
        key: 'cmd',
        source: 'query',
        raw: '%7B%22id%22%3A1%7D',
        urlDecoded: '{"id":1}',
        parsed: '{"id":1}',
        reencoded: encodeURIComponent('{"id":1}'),
        reversible: false,
        repairHint: 'x'.repeat(81),
      },
    ]);

    expect(summary).toMatchObject({
      total: 1,
      repairHints: 1,
      nonReversible: 1,
      keys: [{ key: 'cmd', count: 1 }],
      samples: [{
        path: '$.cmd',
        key: 'cmd',
        reversible: false,
        hasRepairHint: true,
        repairHint: `${'x'.repeat(80)}...`,
      }],
    });
  });
});

describe('decodeSchemeJsonStep', () => {
  it('CMD JSON 展开为对象步骤并保留可逆元数据', () => {
    const scheme = `cmd=${encodeURIComponent('{"id":1,"nested":{"ok":true}}')}`;
    const result = decodeSchemeJsonStep(scheme, 10);

    expect(result?.value).toEqual({ cmd: { id: 1, nested: { ok: true } } });
    expect(result?.step).toMatchObject({
      type: 'scheme_decode',
      originalScheme: scheme,
      originalSchemeType: 'query-string',
      originalSchemeReversible: true,
      decodedSchemeValue: { cmd: { id: 1, nested: { ok: true } } },
    });
  });

  it('非 JSON 或标量结果返回 null，不产生转换步骤', () => {
    expect(decodeSchemeJsonStep(`cmd=${encodeURIComponent('text')}`, 10)).toBeNull();
    expect(decodeSchemeJsonStep(`cmd=${base64Encode('42')}`, 10)).toBeNull();
    expect(decodeSchemeJsonStep('plain text')).toBeNull();
  });
});
