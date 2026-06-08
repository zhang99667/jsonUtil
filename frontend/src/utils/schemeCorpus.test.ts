import { describe, expect, it } from 'vitest';
import { base64Encode, deepDecodeScheme, encodeWithLayers } from './schemeUtils';

const parseDecodedJson = (input: string): unknown => {
  const result = deepDecodeScheme(input);
  expect(result.isJson).toBe(true);
  return JSON.parse(result.decoded) as unknown;
};

describe('CMD/Scheme 真实样本回归', () => {
  it('解析编码 URL 字段并保留外层来源参数', () => {
    expect(parseDecodedJson(
      'baiduboxapp://v1/browser/open?url=https%3A%2F%2Fm.baidu.com%2Fs%3Fword%3Djson%2Bschema&from=feed'
    )).toEqual({
      url: {
        word: 'json schema',
      },
      from: 'feed',
    });
  });

  it('解析未编码 URL 字段中的内层 query 参数', () => {
    expect(parseDecodedJson(
      'url=https://m.baidu.com/s?word=json&from=feed'
    )).toEqual({
      url: {
        word: 'json',
        from: 'feed',
      },
    });
  });

  it('解析裸域名 URL 字段', () => {
    expect(parseDecodedJson('h5Url=m.baidu.com/s?word=json+schema')).toEqual({
      h5Url: {
        word: 'json schema',
      },
    });
  });

  it('解析跳转兜底 URL 字段', () => {
    expect(parseDecodedJson('fallbackUrl=//m.baidu.com/s?word=json+schema')).toEqual({
      fallbackUrl: {
        word: 'json schema',
      },
    });
  });

  it('解析 next 字段中的 hash route', () => {
    expect(parseDecodedJson('next=%23/detail%3Fcmd%3D%257B%2522nid%2522%253A123%257D%26from%3Dnext')).toEqual({
      next: {
        cmd: {
          nid: 123,
        },
        from: 'next',
      },
    });
  });

  it('解析 JSON-like CMD 对象参数', () => {
    expect(parseDecodedJson("cmd={nid:123,title:'标题'}&from=feed")).toEqual({
      cmd: {
        nid: 123,
        title: '标题',
      },
      from: 'feed',
    });
  });

  it('解析 hash route 里的 CMD 参数', () => {
    expect(parseDecodedJson(
      '#/detail?cmd=%7B%22nid%22%3A123%7D&from=hash'
    )).toEqual({
      cmd: {
        nid: 123,
      },
      from: 'hash',
    });
  });

  it('解析 HTML 转义分隔符', () => {
    expect(parseDecodedJson(
      'cmd=%7B%22nid%22%3A123%7D&amp;from=html'
    )).toEqual({
      cmd: {
        nid: 123,
      },
      from: 'html',
    });
  });

  it('解析日志里的 Unicode 转义参数分隔符', () => {
    expect(parseDecodedJson(
      'cmd=%7B%22nid%22%3A123%7D\\u0026from=unicode'
    )).toEqual({
      cmd: {
        nid: 123,
      },
      from: 'unicode',
    });
  });

  it('默认深度可展开真实广告 response 的多层跳转链路', () => {
    const landingUrl = 'https://pro.m.jd.com/mall/active/page.html?sku=101&bd_vid=abc';
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const convertCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
    }))}`;
    const rewardDialog = `nadcorevendor://vendor/ad/rewardDialog?convert_cmd=${encodeURIComponent(convertCmd)}`;
    const responseScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      reward: {
        stay_cmd: rewardDialog,
      },
    }))}`;

    expect(parseDecodedJson(responseScheme)).toEqual({
      video_info: {
        reward: {
          stay_cmd: {
            convert_cmd: {
              params: {
                appUrl: {
                  params: {
                    category: 'jump',
                    url: {
                      sku: '101',
                      bd_vid: 'abc',
                    },
                  },
                },
                source: 'feedna',
              },
            },
          },
        },
      },
    });
  });

  it('解析日志复制出的多行 CMD 参数串', () => {
    expect(parseDecodedJson(
      'cmd=%7B%22nid%22%3A123%7D\n  from=line'
    )).toEqual({
      cmd: {
        nid: 123,
      },
      from: 'line',
    });
  });

  it('解析短 Base64 JSON 参数', () => {
    expect(parseDecodedJson(`cmd=${base64Encode('{"a":1}')}`)).toEqual({
      cmd: {
        a: 1,
      },
    });
  });

  it('未编辑 raw URL 字段可按原形态回写', () => {
    const original = 'url=https://m.baidu.com/s?word=json&from=feed';
    const decoded = deepDecodeScheme(original);

    expect(encodeWithLayers(decoded.decoded, decoded.layers)).toBe(original);
  });
});
