import { describe, expect, it } from 'vitest';
import { base64Encode, deepDecodeScheme, encodeWithLayers } from './schemeUtils';
import { deepParseWithContext, inverseWithContext } from './transformations';

const parseDecodedJson = (input: string): unknown => {
  const result = deepDecodeScheme(input);
  expect(result.isJson).toBe(true);
  return JSON.parse(result.decoded) as unknown;
};

const base64EncodeBytes = (bytes: Uint8Array): string => (
  btoa(String.fromCharCode(...bytes))
);

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

  it('深度格式化可解析脱敏真实 response 中的跳转链路和 extraParam 后缀', () => {
    const landingUrl = 'https://example.com/landing?sku=101&bd_vid=abc';
    const appUrl = `openapp.demo://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const convertCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
    }))}`;
    const rewardDialog = `nadcorevendor://vendor/ad/rewardDialog?convert_cmd=${encodeURIComponent(convertCmd)}`;
    const scheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      reward: {
        stay_cmd: rewardDialog,
      },
      panel: {
        panel_cmd: convertCmd,
      },
      rotation_component: {
        click_event_cmd: '__CONVERT_CMD__',
      },
    }))}`;
    const suffixQuery = '&os=2&ip=127.0.0.1&ua=okhttp%2F3.12.12+SP-engine%2F2.81.0';
    const suffixBytes = [
      ...new TextEncoder().encode(suffixQuery),
      0xff,
    ];
    const extraParam = `AFD8f${base64Encode(JSON.stringify({
      meg_name: 'AI',
      ad_extend: JSON.stringify({
        ad_info: {
          h_ecpm: 207000,
        },
        bid: 138,
      }),
    }))}UxM${base64EncodeBytes(new Uint8Array(suffixBytes))}`;
    const response = JSON.stringify({
      errno: 0,
      errmsg: '',
      data: {
        video: [{
          material: [{
            info: [{
              ad_common: {
                scheme,
              },
            }],
          }],
          extra: [{
            k: 'extraParam',
            v: extraParam,
          }],
          platform: 'android',
        }],
      },
    });

    const { output, context } = deepParseWithContext(response, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    const decodedScheme = parsed.data.video[0].material[0].info[0].ad_common.scheme;
    const decodedExtra = parsed.data.video[0].extra[0].v;

    expect(decodedScheme.video_info.reward.stay_cmd.convert_cmd.params.appUrl.params.url).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(decodedScheme.video_info.panel.panel_cmd.params.source).toBe('feedna');
    expect(decodedScheme.video_info.rotation_component.click_event_cmd).toBe('__CONVERT_CMD__');
    expect(decodedExtra.ad_extend).toEqual({
      ad_info: {
        h_ecpm: 207000,
      },
      bid: 138,
    });
    expect(decodedExtra._base64_suffix_decoded).toMatchObject({
      os: '2',
      ip: '127.0.0.1',
      ua: 'okhttp/3.12.12 SP-engine/2.81.0',
    });

    expect(JSON.parse(inverseWithContext(output, context))).toEqual(JSON.parse(response));
  });
});
