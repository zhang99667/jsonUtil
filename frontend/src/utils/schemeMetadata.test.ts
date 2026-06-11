import { describe, expect, it } from 'vitest';
import {
  extractSchemeCommandSummaryInfo,
  extractBase64MetaInfo,
  formatBase64MetaDisplayValue,
  formatCmdHandlerCompatibleResult,
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

  it('提取 URL Scheme 的 cmdSchema、cmdParams 和嵌套解析线索', () => {
    const decoded = JSON.stringify({
      video_info: {
        tail_frame: {
          panel_scheme: {
            ext_info: {
              user_id: 'u1',
            },
          },
        },
        ext_log: {
          ad_extra_param: {
            cmatch: '1501',
          },
        },
      },
    });

    expect(extractSchemeCommandSummaryInfo(decoded, true, {
      protocol: 'nadcorevendor:',
      host: 'vendor',
      path: '/ad/rewardImpl',
    })).toEqual({
      commandSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      paramCount: 1,
      paramKeys: ['video_info'],
      commandFields: ['panel_scheme'],
      commandFieldCount: 1,
      extFields: ['ext_info', 'ad_extra_param'],
      extFieldCount: 2,
      base64SuffixFields: [],
      base64SuffixFieldCount: 0,
    });
  });

  it('提取 Base64 后缀解析线索', () => {
    const decoded = JSON.stringify({
      meg_name: 'AI',
      _base64_suffix_decoded: {
        os: '2',
        ip: '127.0.0.1',
      },
    });

    expect(extractSchemeCommandSummaryInfo(decoded, true)).toEqual({
      commandSchema: undefined,
      paramCount: 2,
      paramKeys: ['meg_name', '_base64_suffix_decoded'],
      commandFields: [],
      commandFieldCount: 0,
      extFields: [],
      extFieldCount: 0,
      base64SuffixFields: ['os', 'ip'],
      base64SuffixFieldCount: 2,
    });
  });

  it('导出 cmdHandler 风格的 CMD 结构', () => {
    const nestedSource = 'baiduboxapp://v1/panel?ext_info=%7B%22user_id%22%3A%22u1%22%7D';
    const decoded = JSON.stringify({
      params: {
        appUrl: {
          source: 'feedna',
        },
      },
      panel_scheme: {
        ext_info: {
          user_id: 'u1',
        },
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      'baiduboxapp://v7/vendor/ad/deeplink',
      `baiduboxapp://v7/vendor/ad/deeplink?params=%7B%7D&panel_scheme=${encodeURIComponent(nestedSource)}`
    ))).toEqual({
      result: {
        cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
        cmdParams: {
          params: {
            appUrl: {
              source: 'feedna',
            },
          },
          panel_scheme: {
            cmdSchema: 'baiduboxapp://v1/panel',
            cmdParams: {
              ext_info: {
                user_id: 'u1',
              },
            },
            source: nestedSource,
          },
        },
        source: `baiduboxapp://v7/vendor/ad/deeplink?params=%7B%7D&panel_scheme=${encodeURIComponent(nestedSource)}`,
      },
    });
  });

  it('非法 JSON 不导出 CMD 结构', () => {
    expect(formatCmdHandlerCompatibleResult('{bad json}', 'baiduboxapp://v1/open')).toBe('');
  });
});
