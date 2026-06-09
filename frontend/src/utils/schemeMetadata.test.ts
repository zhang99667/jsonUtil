import { describe, expect, it } from 'vitest';
import {
  extractBase64MetaInfo,
  formatBase64MetaDisplayValue,
} from './schemeMetadata';

describe('schemeMetadata', () => {
  it('非 JSON 或普通 JSON 不展示内部 Base64 元信息', () => {
    expect(extractBase64MetaInfo('plain text', false)).toBeNull();
    expect(extractBase64MetaInfo('{"name":"json"}', true)).toBeNull();
    expect(extractBase64MetaInfo('{bad json}', true)).toBeNull();
  });

  it('提取内部 Base64 前缀、后缀和后缀参数摘要', () => {
    const info = extractBase64MetaInfo(JSON.stringify({
      meg_name: 'AI',
      _base64_prefix: 'AFD8f',
      _base64_suffix: 'UxMJm9zPTImaXA9MTI3LjAuMC4x',
      _base64_suffix_decode_prefix: 'UxM',
      _base64_suffix_decoded: {
        os: '2',
        ip: '127.0.0.1',
        ad_info: { bid: 138 },
      },
    }), true);

    expect(info).toEqual({
      prefix: 'AFD8f',
      suffix: 'UxMJm9zPTImaXA9MTI3LjAuMC4x',
      suffixDecodePrefix: 'UxM',
      suffixLength: 27,
      suffixDecodedCount: 3,
      suffixDecodedEntries: [
        { key: 'os', displayValue: '2' },
        { key: 'ip', displayValue: '127.0.0.1' },
        { key: 'ad_info', displayValue: '{"bid":138}' },
      ],
    });
  });

  it('长值会被裁剪成适合徽标展示的预览', () => {
    expect(formatBase64MetaDisplayValue('x'.repeat(70))).toBe(`${'x'.repeat(64)}...`);
  });
});
