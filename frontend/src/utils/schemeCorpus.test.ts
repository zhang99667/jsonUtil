import { describe, expect, it } from 'vitest';
import { base64Encode, deepDecodeScheme, encodeWithLayers } from './schemeUtils';
import { deepParseWithContext, inverseWithContext } from './transformations';
import { scanSchemesInJson } from './schemeScanner';
import { buildTransformContextReport } from './transformSummary';

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

  it('整段广告 response 可对齐 cmdHandler 风格的 schema 与参数结构', () => {
    const finalUrl = 'https://pro.m.jd.com/mall/active/page.html?sku=101&bd_vid=abc';
    const landingUrl = `https://union-click.jd.com/sem.php?source=baidu-ys&unionId=262767352&to=${encodeURIComponent(finalUrl)}`;
    const webUrl = `baiduboxapp://v1/easybrowse/open?url=${encodeURIComponent(landingUrl)}&adFlag=${encodeURIComponent(JSON.stringify({
      ext: '__AD_EXTRA_PARAM_ENCODE_1__',
      nid: 'ad1_101',
    }))}`;
    const monitorCallbackUrl = [
      'https://callback.example.com/track?clickId=__CLICK_ID__',
      'sign=__SIGN__',
      'callbackUrl=__CALLBACK_URL__',
    ].join('&');
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      des: 'm',
      url: landingUrl,
    }))}`;
    const deeplinkCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      webUrl,
      source: 'feedna',
      extInfo: base64Encode(JSON.stringify({ user_id: '74314439', cmatch: '1501' })),
    }))}`;
    const taskParams = encodeURIComponent(JSON.stringify({
      android_pid: '1683310188080',
      task_id: '602',
      ext_params: {
        reward_num: '__REWARD_NUM__',
      },
      ext_policy: JSON.stringify({
        invoke_task_id: '',
        sdk_switch: '1',
      }),
    }));
    const rewardButtonCmd = `nadcorevendor://vendor/ad/reward?task_params=${taskParams}`;
    const rewardDialog = `nadcorevendor://vendor/ad/rewardDialog?convert_btn=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
      button_text: '打开应用并体验',
    }))}&main_btn=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONTINUEPLAY__',
      button_text: '继续完成任务',
    }))}&bottom_right_btn=${encodeURIComponent(JSON.stringify({
      button_cmd: rewardButtonCmd,
      button_text: '换个视频',
    }))}&convert_cmd=${encodeURIComponent(deeplinkCmd)}`;
    const panelScheme = `nadcorevendor://vendor/ad/rewardWebPanel?panel_cmd=${encodeURIComponent(deeplinkCmd)}&url=${encodeURIComponent(landingUrl)}&lp_real_url=${encodeURIComponent(landingUrl)}`;
    const rootScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      vid: '1353102586669',
      page_url: landingUrl,
      tail_frame: {
        bottom_button_scheme: rewardButtonCmd,
        panel_scheme: panelScheme,
      },
    }))}&reward=${encodeURIComponent(JSON.stringify({
      stay_cmd: rewardDialog,
      reward_cmd: rewardDialog,
      strong_guide_cmd: rewardDialog,
      task_policy: JSON.stringify({ ecpm: 'encoded', businessParams: 'encoded' }),
    }))}&cmd_policy=${encodeURIComponent(JSON.stringify({
      panel_cmd: deeplinkCmd,
      callbackUrl: monitorCallbackUrl,
    }))}&common_info=${encodeURIComponent(JSON.stringify({
      callbackUrl: monitorCallbackUrl,
    }))}&panel=${encodeURIComponent(JSON.stringify({
      panel_cmd: deeplinkCmd,
      webpanel_cmd: deeplinkCmd,
    }))}&rotation_component=${encodeURIComponent(JSON.stringify({
      click_event_cmd: '__CONVERT_CMD__',
      webpanel_event_cmd: '__WEBPANEL_CMD__',
    }))}&ad_tag=${encodeURIComponent(JSON.stringify({
      text: '广告',
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
                scheme: rootScheme,
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

    const scanResult = scanSchemesInJson(response);
    expect(scanResult.locations.map(item => ({
      path: item.path,
      label: item.label,
      type: item.schemeType,
    }))).toEqual([
      {
        path: '$.data.video[0].material[0].info[0].ad_common.scheme',
        label: undefined,
        type: 'url',
      },
      {
        path: '$.data.video[0].extra[0].v',
        label: 'extraParam',
        type: 'base64',
      },
    ]);

    const { output, context } = deepParseWithContext(response, { autoExpandScheme: true });
    const parsed = JSON.parse(output);
    const decodedScheme = parsed.data.video[0].material[0].info[0].ad_common.scheme;
    const decodedExtra = parsed.data.video[0].extra[0].v;
    const report = buildTransformContextReport(context);
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
    expect(allCommandSchemas).toEqual(expect.arrayContaining([
      'nadcorevendor://vendor/ad/rewardImpl',
      'nadcorevendor://vendor/ad/rewardWebPanel',
      'nadcorevendor://vendor/ad/rewardDialog',
      'baiduboxapp://v7/vendor/ad/deeplink',
      'baiduboxapp://v1/easybrowse/open',
      'openapp.jdmobile://virtual',
      'https://union-click.jd.com/sem.php',
      'https://callback.example.com/track',
    ]));
    expect(report.nestedCommandFieldCount).toBeGreaterThanOrEqual(20);
    expect(report.runtimePlaceholderGroups.map(group => group.value)).toEqual(expect.arrayContaining([
      '__CONVERT_CMD__',
      '__WEBPANEL_CMD__',
      '__AD_EXTRA_PARAM_ENCODE_1__',
      '__REWARD_NUM__',
      '__CONTINUEPLAY__',
      '__CLICK_ID__',
      '__SIGN__',
      '__CALLBACK_URL__',
    ]));
    expect(copiedCmdStructure).toMatchObject({
      result: {
        cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
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
        },
      },
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
