import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { base64Encode, deepDecodeScheme, encodeWithLayers } from './schemeUtils';
import { deepParseWithContext, inverseWithContext } from './transformations';
import { scanSchemesInJson } from './schemeScanner';
import { diffCmdStructures, formatCmdStructureDiff } from './cmdStructureDiff';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformQualitySnapshotJsonText,
} from './transformSummary';

const parseDecodedJson = (input: string): unknown => {
  const result = deepDecodeScheme(input);
  expect(result.isJson).toBe(true);
  return JSON.parse(result.decoded) as unknown;
};

const base64EncodeBytes = (bytes: Uint8Array): string => (
  btoa(String.fromCharCode(...bytes))
);

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface SchemeCorpusFixture {
  schemaVersion: number;
  name: string;
  responseTemplate: JsonValue;
  replacements: Record<string, string[]>;
}

interface SchemeCorpusExpectedSnapshot {
  schemaVersion: number;
  sample: string;
  cmdHandlerExpected: string;
  scanLocations: Array<{
    path: string;
    label?: string;
    type: string;
  }>;
  quality: {
    minCoverageScore: number;
    minCmdStructures: number;
    minNestedCommandFields: number;
    minNestedResourceFields: number;
    maxUnresolved: number;
    maxWarnings: number;
    leadHotspotCommandSchema: string;
    leadHotspotResourceSchema?: string;
    leadHotspotResourceField: string;
  };
  primaryCommandSchema: string;
  requiredCommandSchemas: string[];
  requiredRuntimePlaceholders: string[];
}

const readCorpusJson = <T,>(filename: string): T => (
  JSON.parse(readFileSync(new URL(`../../fixtures/scheme-corpus/${filename}`, import.meta.url), 'utf8')) as T
);

const applyCorpusReplacements = (
  value: JsonValue,
  replacements: Record<string, string[]>
): JsonValue => {
  if (typeof value === 'string') {
    return replacements[value]?.join('') ?? value;
  }

  if (Array.isArray(value)) {
    return value.map(item => applyCorpusReplacements(item, replacements));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, JsonValue> = {};
    Object.entries(value).forEach(([key, child]) => {
      output[key] = applyCorpusReplacements(child, replacements);
    });
    return output;
  }

  return value;
};

const buildCorpusResponseText = (fixture: SchemeCorpusFixture): string => (
  JSON.stringify(applyCorpusReplacements(fixture.responseTemplate, fixture.replacements))
);

const rewardResponseCorpus = readCorpusJson<SchemeCorpusFixture>('reward-response.redacted.json');
const rewardResponseBaseline = readCorpusJson<SchemeCorpusExpectedSnapshot>('reward-response.expected.snapshot.json');
const rewardResponseCmdHandlerExpected = readCorpusJson<JsonValue>(rewardResponseBaseline.cmdHandlerExpected);

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

  it('解析 HTML 引号实体包裹的 CMD JSON 参数', () => {
    expect(parseDecodedJson(
      'cmd={&quot;nid&quot;:123,&quot;title&quot;:&quot;标题&quot;}&amp;from=html-quote'
    )).toEqual({
      cmd: {
        nid: 123,
        title: '标题',
      },
      from: 'html-quote',
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

  it('解析电话拨打 Scheme 里的号码、监测 URL 与 extInfo', () => {
    const extInfo = base64Encode(JSON.stringify({
      search_id: 'a433862f59552397',
      cmatch: 222,
      rank: 2,
    }));
    const numberUrl = `https://ada.baidu.com/phone-tracker/getNumber?query=${encodeURIComponent('种植')}&realPhone=400-805-8686&solutionId=__SOLUTIONID__`;
    const logUrl = 'https://ada.baidu.com/phone-tracker/clicklog?pageid=__TIMESTAMP__&virtualPhone=__VIRTUALPHONE__&realPhone=400-805-8686';
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
      phone: '400-805-8686',
      numberUrl,
      logUrl,
      extInfo,
      type: 1,
    }))}`;

    const decoded = deepDecodeScheme(scheme);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(decoded.schemeInfo).toMatchObject({
      protocol: 'baiduboxapp:',
      host: 'v7',
      path: '/vendor/ad/makePhoneCall',
    });
    expect(parsed).toEqual({
      params: {
        phone: '400-805-8686',
        numberUrl: {
          query: '种植',
          realPhone: '400-805-8686',
          solutionId: '__SOLUTIONID__',
        },
        logUrl: {
          pageid: '__TIMESTAMP__',
          virtualPhone: '__VIRTUALPHONE__',
          realPhone: '400-805-8686',
        },
        extInfo: {
          search_id: 'a433862f59552397',
          cmatch: 222,
          rank: 2,
        },
        type: 1,
      },
    });
    expect(decoded.placeholders?.map(placeholder => placeholder.value).sort()).toEqual([
      '__SOLUTIONID__',
      '__TIMESTAMP__',
      '__VIRTUALPHONE__',
    ]);
  });

  it('解析电话 Scheme 内落地页 hash 后追加的追踪参数', () => {
    const landingUrl = `https://ada.baidu.com/site/demo/agent?imid=31&source=baidu#zzzaz1)&unit=${encodeURIComponent('种植牙')}&keyword=${encodeURIComponent('收费表')}&e_creative=134`;
    const numberUrl = `https://ada.baidu.com/phone-tracker/getNumber?url=${encodeURIComponent(landingUrl)}&query=${encodeURIComponent('种植牙')}`;
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${encodeURIComponent(JSON.stringify({
      phone: '400-805-8686',
      numberUrl,
      type: 1,
    }))}`;

    const decoded = deepDecodeScheme(scheme);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(parsed).toEqual({
      params: {
        phone: '400-805-8686',
        numberUrl: {
          url: {
            imid: '31',
            source: 'baidu',
            _hash: {
              unit: '种植牙',
              keyword: '收费表',
              e_creative: '134',
            },
          },
          query: '种植牙',
        },
        type: 1,
      },
    });
  });

  it('解析半解码电话拨打 Scheme 中未编码 & 的监测 URL', () => {
    const extInfo = base64Encode(JSON.stringify({ rank: 2 }));
    const rawParams = JSON.stringify({
      phone: '400-805-8686',
      numberUrl: 'https://ada.baidu.com/phone-tracker/getNumber?a=1&b=2&solutionId=__SOLUTIONID__',
      logUrl: 'https://ada.baidu.com/phone-tracker/clicklog?pageid=__TIMESTAMP__&realPhone=400-805-8686',
      extInfo,
    });
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${rawParams}`;

    const decoded = deepDecodeScheme(scheme);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(decoded.schemeInfo?.params).toEqual({
      params: rawParams,
    });
    expect(parsed).toEqual({
      params: {
        phone: '400-805-8686',
        numberUrl: {
          a: '1',
          b: '2',
          solutionId: '__SOLUTIONID__',
        },
        logUrl: {
          pageid: '__TIMESTAMP__',
          realPhone: '400-805-8686',
        },
        extInfo: {
          rank: 2,
        },
      },
    });
  });

  it('解析半解码电话拨打 Scheme 中 params 后续外层参数', () => {
    const rawParams = JSON.stringify({
      phone: '400-805-8686',
      numberUrl: 'https://ada.baidu.com/phone-tracker/getNumber?a=1&b=2',
    });
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${rawParams}&source=feed`;

    const decoded = deepDecodeScheme(scheme);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(decoded.schemeInfo?.params).toEqual({
      params: rawParams,
      source: 'feed',
    });
    expect(parsed).toEqual({
      params: {
        phone: '400-805-8686',
        numberUrl: {
          a: '1',
          b: '2',
        },
      },
      source: 'feed',
    });
  });

  it('解析半解码 loose JSON 中单引号字符串里的花括号', () => {
    const rawParams = "{'title':'a}b','numberUrl':'https://ada.baidu.com/phone-tracker/getNumber?a=1&b=2'}";
    const scheme = `baiduboxapp://v7/vendor/ad/makePhoneCall?params=${rawParams}&source=feed`;

    const decoded = deepDecodeScheme(scheme);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(decoded.schemeInfo?.params).toEqual({
      params: rawParams,
      source: 'feed',
    });
    expect(parsed).toEqual({
      params: {
        title: 'a}b',
        numberUrl: {
          a: '1',
          b: '2',
        },
      },
      source: 'feed',
    });
  });

  it('解析真实广告单字段 task_params 参数', () => {
    const taskParams = encodeURIComponent(JSON.stringify({
      android_pid: '1683310188080',
      task_id: '602',
      ext_policy: JSON.stringify({
        sdk_switch: '1',
        invoke_task_id: '',
      }),
    }));

    expect(parseDecodedJson(`task_params=${taskParams}`)).toEqual({
      task_params: {
        android_pid: '1683310188080',
        task_id: '602',
        ext_policy: {
          sdk_switch: '1',
          invoke_task_id: '',
        },
      },
    });
  });

  it('解析真实广告单字段 convert_cmd 链路', () => {
    const appUrl = `openapp.demo://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: 'https://example.com/landing?sku=101&bd_vid=abc',
    }))}`;
    const convertCmd = encodeURIComponent(`baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
    }))}`);

    expect(parseDecodedJson(`convert_cmd=${convertCmd}`)).toEqual({
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
    });
  });

  it('解析真实广告局部按钮和监测字段', () => {
    const buttonCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const convertBtn = encodeURIComponent(JSON.stringify({
      button_cmd: buttonCmd,
      button_text: '打开应用',
    }));
    const monitor = encodeURIComponent(JSON.stringify([{
      click_url: {
        url: 'https://example.com/track?mid=1&from=ad',
      },
    }]));

    expect(parseDecodedJson(`button_cmd=${buttonCmd}`)).toEqual({
      button_cmd: {
        cmd: {
          nid: 123,
        },
      },
    });
    expect(parseDecodedJson(`convert_btn=${convertBtn}`)).toEqual({
      convert_btn: {
        button_cmd: {
          cmd: {
            nid: 123,
          },
        },
        button_text: '打开应用',
      },
    });
    expect(parseDecodedJson(`ad_monitor_url=${monitor}`)).toEqual({
      ad_monitor_url: [{
        click_url: {
          url: {
            mid: '1',
            from: 'ad',
          },
        },
      }],
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
    const bottomButtonScheme = `nadcorevendor://vendor/ad/reward?task_params=${encodeURIComponent(JSON.stringify({
      android_pid: '1683310188080',
      task_id: '602',
      ext_params: {
        reward_num: '__REWARD_NUM__',
      },
      ext_policy: JSON.stringify({
        sdk_switch: '1',
        back_cmd: '',
      }),
    }))}`;
    const scheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      reward: {
        stay_cmd: rewardDialog,
      },
      tail_frame: {
        bottom_button_scheme: bottomButtonScheme,
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
    expect(decodedScheme.video_info.tail_frame.bottom_button_scheme.task_params.task_id).toBe('602');
    expect(decodedScheme.video_info.tail_frame.bottom_button_scheme.task_params.ext_params.reward_num).toBe('__REWARD_NUM__');
    expect(decodedScheme.video_info.tail_frame.bottom_button_scheme.task_params.ext_policy.sdk_switch).toBe('1');
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

  it('深度格式化可解析真实 response 业务外壳和 ext_log 扩展参数', () => {
    const landingUrl = 'https://example.com/landing?sku=101&bd_vid=abc';
    const adExtraParam = base64Encode(JSON.stringify({
      user_id: 'redacted_user',
      cpid: '1001',
      place_id: '1683310188080',
      ext5: {
        protocal_header: 'openapp.demo',
        apk_name: 'com.example.app',
      },
    })).replace(/=/g, '%3D');
    const bottomButtonScheme = `nadcorevendor://vendor/ad/reward?task_params=${encodeURIComponent(JSON.stringify({
      android_pid: '1683310188080',
      task_id: '602',
      ext_params: {
        reward_num: '__REWARD_NUM__',
      },
      ext_policy: JSON.stringify({
        sdk_switch: '1',
        complete_info: '',
      }),
    }))}`;
    const stayCmd = `nadcorevendor://vendor/ad/rewardDialog?convert_btn=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
      button_text: '打开应用并体验',
    }))}`;
    const rootScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      video_url: 'https://video.example.com/ad.mp4?pd=100&cm=1501',
      page_url: landingUrl,
      ext_log: {
        pdRec: 'reward',
        ad_extra_param: adExtraParam,
      },
      tail_frame: {
        bottom_button_text: '__COINTIPS__',
        bottom_button_scheme: bottomButtonScheme,
      },
    }))}&reward=${encodeURIComponent(JSON.stringify({
      task_policy: JSON.stringify({
        ecpm: 'encoded_ecpm',
        businessParams: 'encoded_business_params',
        cpid_type: 'cpc',
      }),
      stay_cmd: stayCmd,
    }))}&rotation_component=${encodeURIComponent(JSON.stringify({
      click_event_cmd: '__CONVERT_CMD__',
      webpanel_event_cmd: '__WEBPANEL_CMD__',
    }))}`;
    const response = JSON.stringify({
      errno: 0,
      errmsg: '',
      data: {
        video: [{
          isRenderReturnGoodsInfo: true,
          material: [{
            info: [{
              ad_common: {
                scheme: rootScheme,
              },
              supportCMD: true,
              render_sbox: {
                sbox_switch: 4,
              },
            }],
            imTimeSign: 110,
            templateId: '',
          }],
          extra: [
            {
              k: 'extraParam',
              v: `AFD8f${base64Encode(JSON.stringify({
                meg_name: 'AI',
                ad_extend: JSON.stringify({
                  ad_info: {
                    h_ecpm: 207000,
                  },
                }),
              }))}UxM${base64Encode('&os=2&ip=127.0.0.1')}`,
            },
            {
              k: 'dislikeReason',
              v: {
                have_seen: '广告重复',
                have_density: '广告密集',
                ad_brand: '千问',
              },
            },
            {
              k: 'ubsParam',
              v: {
                ideaid: '1353104569522',
                cmatch: 1501,
                adload_related_tag: '',
              },
            },
            {
              k: 'sboxParam',
              v: {
                client_params: {
                  reward_crius_download_charge: '1',
                },
                idea_id: 1353104569522,
              },
            },
          ],
          platform: 'android',
        }],
      },
    });

    const { output, context } = deepParseWithContext(response, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    const info = parsed.data.video[0].material[0].info[0];
    const decodedScheme = info.ad_common.scheme;
    const report = buildTransformContextReport(context);

    expect(info.supportCMD).toBe(true);
    expect(info.render_sbox.sbox_switch).toBe(4);
    expect(parsed.data.video[0].isRenderReturnGoodsInfo).toBe(true);
    expect(decodedScheme.video_info.video_url).toEqual({
      pd: '100',
      cm: '1501',
    });
    expect(decodedScheme.video_info.page_url).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(decodedScheme.video_info.ext_log.ad_extra_param).toMatchObject({
      user_id: 'redacted_user',
      ext5: {
        apk_name: 'com.example.app',
      },
    });
    expect(decodedScheme.video_info.tail_frame.bottom_button_scheme.task_params.ext_policy.sdk_switch).toBe('1');
    expect(decodedScheme.reward.task_policy).toMatchObject({
      cpid_type: 'cpc',
    });
    expect(decodedScheme.reward.stay_cmd.convert_btn.button_cmd).toBe('__CONVERT_CMD__');
    expect(decodedScheme.rotation_component.webpanel_event_cmd).toBe('__WEBPANEL_CMD__');
    expect(parsed.data.video[0].extra[0].v._base64_suffix_decoded).toMatchObject({
      os: '2',
      ip: '127.0.0.1',
    });
    expect(parsed.data.video[0].extra[1].v.ad_brand).toBe('千问');
    expect(parsed.data.video[0].extra[2].v.cmatch).toBe(1501);
    expect(parsed.data.video[0].extra[3].v.client_params.reward_crius_download_charge).toBe('1');
    expect(report.summary.warningCount).toBe(0);
    expect(report.summary.unresolvedCount).toBe(0);
  });

  it('整段广告 response 可对齐 cmdHandler 风格的 schema 与参数结构', () => {
    expect(rewardResponseBaseline.sample).toBe(rewardResponseCorpus.name);
    const response = buildCorpusResponseText(rewardResponseCorpus);

    const scanResult = scanSchemesInJson(response);
    expect(scanResult.locations.map(item => ({
      path: item.path,
      ...(item.label === undefined ? {} : { label: item.label }),
      type: item.schemeType,
    }))).toEqual(rewardResponseBaseline.scanLocations);

    const { output, context } = deepParseWithContext(response, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    const decodedScheme = parsed.data.video[0].material[0].info[0].ad_common.scheme;
    const decodedExtra = parsed.data.video[0].extra[0].v;
    const report = buildTransformContextReport(context);
    const reportView = buildTransformReportView(report, '');
    const qualitySnapshot = JSON.parse(formatTransformQualitySnapshotJsonText(report, reportView, ''));
    const rootRecord = report.records.find(record => record.path.endsWith('.ad_common.scheme'));
    const allCommandSchemas = report.records.flatMap(record => (
      [
        record.commandSchema,
        ...(record.commandSchemaRows?.map(row => row.schema) || []),
      ].filter((schema): schema is string => Boolean(schema))
    ));
    const copiedCmdStructure = rootRecord?.getCmdStructureCopyText
      ? JSON.parse(rootRecord.getCmdStructureCopyText())
      : undefined;

    expect(decodedScheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params).toMatchObject({
      category: 'jump',
      des: 'm',
    });
    expect(decodedScheme.video_info.video_url).toEqual({
      pd: '100',
      cm: '1501',
    });
    expect(decodedScheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params.url.to).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(decodedScheme.reward.stay_cmd.convert_cmd.params.webUrl).toMatchObject({
      url: {
        to: {
          sku: '101',
          bd_vid: 'abc',
        },
      },
      adFlag: {
        ext: '__AD_EXTRA_PARAM_ENCODE_1__',
        nid: 'ad1_101',
      },
    });
    expect(decodedScheme.reward.reward_cmd.bottom_right_btn.button_cmd.task_params.ext_policy.sdk_switch).toBe('1');
    expect(decodedScheme.convert.button_scheme.params.appUrl.params.url.to).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(decodedScheme.cmd_policy.panel_cmd.params.appUrl.params.url.to).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(decodedScheme.cmd_policy.callbackUrl).toEqual({
      clickId: '__CLICK_ID__',
      sign: '__SIGN__',
      callbackUrl: '__CALLBACK_URL__',
    });
    expect(decodedScheme.common_info.callbackUrl.callbackUrl).toBe('__CALLBACK_URL__');
    expect(decodedScheme.common_info.ad_monitor_url[0].click_url.callbackUrl).toBe('__CALLBACK_URL__');
    expect(decodedScheme.panel.webpanel_cmd.params.webUrl.adFlag.ext).toBe('__AD_EXTRA_PARAM_ENCODE_1__');
    expect(decodedScheme.rotation_component).toEqual({
      click_event_cmd: '__CONVERT_CMD__',
      webpanel_event_cmd: '__WEBPANEL_CMD__',
    });
    expect(decodedExtra.ad_extend.ad_info.h_ecpm).toBe(207000);
    expect(decodedExtra._base64_suffix_decoded).toMatchObject({
      os: '2',
      ip: '127.0.0.1',
      ua: 'okhttp/3.12.12 SP-engine/2.81.0',
    });
    expect(rootRecord?.commandSchema).toBe(rewardResponseBaseline.primaryCommandSchema);
    expect(allCommandSchemas).toEqual(expect.arrayContaining(rewardResponseBaseline.requiredCommandSchemas));
    expect(report.coverage.score).toBeGreaterThanOrEqual(rewardResponseBaseline.quality.minCoverageScore);
    expect(report.cmdStructureCount).toBeGreaterThanOrEqual(rewardResponseBaseline.quality.minCmdStructures);
    expect(report.nestedCommandFieldCount).toBeGreaterThanOrEqual(rewardResponseBaseline.quality.minNestedCommandFields);
    expect(report.nestedResourceFieldCount).toBeGreaterThanOrEqual(rewardResponseBaseline.quality.minNestedResourceFields);
    expect(report.summary.unresolvedCount).toBeLessThanOrEqual(rewardResponseBaseline.quality.maxUnresolved);
    expect(report.summary.warningCount).toBeLessThanOrEqual(rewardResponseBaseline.quality.maxWarnings);
    expect(qualitySnapshot.coverage.score).toBeGreaterThanOrEqual(rewardResponseBaseline.quality.minCoverageScore);
    expect(qualitySnapshot.totals.nestedResourceFields).toBeGreaterThanOrEqual(
      rewardResponseBaseline.quality.minNestedResourceFields
    );
    expect(qualitySnapshot.totals.unresolved).toBeLessThanOrEqual(rewardResponseBaseline.quality.maxUnresolved);
    expect(qualitySnapshot.totals.warnings).toBeLessThanOrEqual(rewardResponseBaseline.quality.maxWarnings);
    expect(qualitySnapshot.hotspots.topCommandSchemas[0].schema).toBe(
      rewardResponseBaseline.quality.leadHotspotCommandSchema
    );
    if (rewardResponseBaseline.quality.leadHotspotResourceSchema) {
      expect(qualitySnapshot.hotspots.topResourceSchemas[0]?.schema).toBe(
        rewardResponseBaseline.quality.leadHotspotResourceSchema
      );
    } else {
      expect(qualitySnapshot.hotspots.topResourceSchemas).toEqual([]);
    }
    expect(qualitySnapshot.hotspots.topNestedResourceFields[0].key).toBe(
      rewardResponseBaseline.quality.leadHotspotResourceField
    );
    expect(report.runtimePlaceholderGroups.map(group => group.value)).toEqual(expect.arrayContaining(
      rewardResponseBaseline.requiredRuntimePlaceholders
    ));
    expect(copiedCmdStructure).toMatchObject({
      result: {
        cmdSchema: rewardResponseBaseline.primaryCommandSchema,
        cmdParams: {
          video_info: {
            tail_frame: {
              panel_scheme: {
                cmdSchema: 'nadcorevendor://vendor/ad/rewardWebPanel',
                cmdParams: {
                  panel_cmd: {
                    cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
                    cmdParams: {
                      params: {
                        appUrl: {
                          cmdSchema: 'openapp.jdmobile://virtual',
                        },
                        webUrl: {
                          cmdSchema: 'baiduboxapp://v1/easybrowse/open',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          convert: {
            button_scheme: {
              cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
            },
          },
        },
      },
    });

    const cmdHandlerDiff = diffCmdStructures(
      copiedCmdStructure as JsonValue,
      rewardResponseCmdHandlerExpected,
      { ignoreExtraPaths: true }
    );

    expect(formatCmdStructureDiff(cmdHandlerDiff)).toContain('结构一致');
    expect(cmdHandlerDiff).toMatchObject({
      hasDifferences: false,
      schemaDiff: null,
      missingPaths: [],
      valueDiffs: [],
    });
  });

  it('独立 Scheme 解析可直接展开整段 JSON response 中的广告链路', () => {
    const landingUrl = 'https://example.com/landing?sku=101&bd_vid=abc';
    const appUrl = `openapp.demo://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const deeplinkCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
    }))}`;
    const panelScheme = `nadcorevendor://vendor/ad/rewardWebPanel?panel_cmd=${encodeURIComponent(deeplinkCmd)}&url=${encodeURIComponent(landingUrl)}`;
    const rootScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      tail_frame: {
        panel_scheme: panelScheme,
      },
      rotation_component: {
        click_event_cmd: '__CONVERT_CMD__',
      },
    }))}`;
    const extraParam = `AFD8f${base64Encode(JSON.stringify({
      meg_name: 'AI',
      ad_extend: JSON.stringify({
        ad_info: {
          h_ecpm: 207000,
        },
      }),
    }))}`;
    const response = JSON.stringify({
      errno: 0,
      data: {
        video: [{
          material: [{
            info: [{
              ad_common: {
                scheme: rootScheme,
              },
            }],
          }],
          extra: [{
            k: 'extraParam',
            v: extraParam,
          }],
        }],
      },
    });

    const decoded = deepDecodeScheme(response);
    const parsed = JSON.parse(decoded.decoded);

    expect(decoded.isJson).toBe(true);
    expect(parsed.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params.url).toEqual({
      sku: '101',
      bd_vid: 'abc',
    });
    expect(parsed.data.video[0].material[0].info[0].ad_common.scheme.video_info.rotation_component.click_event_cmd).toBe('__CONVERT_CMD__');
    expect(parsed.data.video[0].extra[0].v.ad_extend.ad_info.h_ecpm).toBe(207000);
    expect(decoded.placeholders?.map(placeholder => placeholder.value)).toContain('__CONVERT_CMD__');
  });
});
