import { describe, expect, it } from 'vitest';
import { decodeRawCmdCandidate } from './cmdStructureRawSourceDecoder';

describe('cmdStructureRawSourceDecoder', () => {
  it('解码 URL 编码的 JSON 参数并递归展开内层 CMD', () => {
    const innerCmd = 'sampleapp://v1/deeplink?foo=bar';
    const params = {
      title: '奖励弹窗',
      convert_cmd: innerCmd,
    };
    const source = `sampleapp://v1/panel?params=${encodeURIComponent(JSON.stringify(params))}`;

    expect(decodeRawCmdCandidate(source)).toEqual({
      cmdSchema: 'sampleapp://v1/panel',
      cmdParams: {
        params: {
          title: '奖励弹窗',
          convert_cmd: {
            cmdSchema: 'sampleapp://v1/deeplink',
            cmdParams: {
              foo: 'bar',
            },
            source: innerCmd,
          },
        },
      },
      source,
    });
  });

  it('支持仅 query 参数串作为待对比结构', () => {
    expect(decodeRawCmdCandidate('foo=bar&foo=baz&url=https%3A%2F%2Fexample.com%2Flanding%3Fsku%3D101')).toEqual({
      cmdParams: {
        foo: ['bar', 'baz'],
        url: {
          cmdSchema: 'https://example.com/landing',
          cmdParams: {
            sku: '101',
          },
          source: 'https://example.com/landing?sku=101',
        },
      },
      source: 'foo=bar&foo=baz&url=https://example.com/landing?sku=101',
    });
  });

  it('非 CMD 和非 query 文本不会被解码为结构', () => {
    expect(decodeRawCmdCandidate('普通标题')).toBeNull();
  });
});
