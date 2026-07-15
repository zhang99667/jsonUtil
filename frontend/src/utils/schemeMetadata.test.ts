import { describe, expect, it } from 'vitest';
import {
  extractSchemeCommandSummaryInfo,
  extractBase64MetaInfo,
  formatBase64MetaDisplayValue,
  formatCmdHandlerCompatibleResult,
  formatPrimaryCmdHandlerCompatibleResult,
  getSchemeCommandSchemaFromUrl,
  getSchemeInsightFieldCopyText,
} from './schemeMetadata';
import { base64Encode, deepDecodeScheme } from './schemeUtils';

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

  it('普通 HTTPS URL 不生成 cmdSchema', () => {
    const plainUrl = 'https://example.com/page?from=feed';
    const structuredUrl = `https://example.com/callback?cmd=${encodeURIComponent(JSON.stringify({ a: 1 }))}`;

    expect(getSchemeCommandSchemaFromUrl(plainUrl)).toBeUndefined();
    expect(getSchemeCommandSchemaFromUrl(structuredUrl)).toBe('https://example.com/callback');
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
            segment: '1501',
          },
        },
      },
    });

    expect(extractSchemeCommandSummaryInfo(decoded, true, {
      protocol: 'samplevendor:',
      host: 'vendor',
      path: '/ad/rewardImpl',
    })).toEqual({
      commandSchema: 'samplevendor://vendor/ad/rewardImpl',
      paramCount: 1,
      paramKeys: ['video_info'],
      commandSchemaCount: 1,
      topCommandSchemas: [{
        schema: 'samplevendor://vendor/ad/rewardImpl',
        count: 1,
        paths: ['$'],
        hasMorePaths: false,
      }],
      commandFields: ['panel_scheme'],
      commandFieldRows: [
        {
          key: 'panel_scheme',
          path: '$.video_info.tail_frame.panel_scheme',
          preview: '对象: ext_info',
          value: {
            ext_info: {
              user_id: 'u1',
            },
          },
        },
      ],
      commandFieldCount: 1,
      resourceFields: [],
      resourceFieldRows: [],
      resourceFieldCount: 0,
      extFields: ['ext_info', 'ad_extra_param'],
      extFieldCount: 2,
      base64SuffixFields: [],
      base64SuffixFieldCount: 0,
    });
    const info = extractSchemeCommandSummaryInfo(decoded, true);
    expect(info?.commandFieldRows[0] ? getSchemeInsightFieldCopyText(info.commandFieldRows[0]) : '').toBe(
      '$.video_info.tail_frame.panel_scheme = {"ext_info":{"user_id":"u1"}}'
    );
  });

  it('提取广告按钮和监测字段的嵌套解析线索', () => {
    const decoded = JSON.stringify({
      convert_btn: {
        button_cmd: {
          cmd: {
            nid: 123,
          },
        },
      },
      main_btn: {
        scheme: {
          params: {
            id: 'main',
          },
        },
      },
      ad_monitor_url: [
        {
          click_url: {
            url: {
              mid: '1',
            },
          },
        },
      ],
    });

    const info = extractSchemeCommandSummaryInfo(decoded, true);

    expect(info?.commandFields).toEqual([
      'convert_btn',
      'button_cmd',
      'cmd',
      'main_btn',
      'scheme',
      'ad_monitor_url',
      'click_url',
      'url',
    ]);
    expect(info?.commandFieldRows.map(row => ({
      key: row.key,
      path: row.path,
      preview: row.preview,
    }))).toEqual([
      {
        key: 'convert_btn',
        path: '$.convert_btn',
        preview: '对象: button_cmd',
      },
      {
        key: 'button_cmd',
        path: '$.convert_btn.button_cmd',
        preview: '对象: cmd',
      },
      {
        key: 'cmd',
        path: '$.convert_btn.button_cmd.cmd',
        preview: '对象: nid',
      },
      {
        key: 'main_btn',
        path: '$.main_btn',
        preview: '对象: scheme',
      },
      {
        key: 'scheme',
        path: '$.main_btn.scheme',
        preview: '对象: params',
      },
      {
        key: 'ad_monitor_url',
        path: '$.ad_monitor_url',
        preview: '数组 1 项',
      },
      {
        key: 'click_url',
        path: '$.ad_monitor_url[0].click_url',
        preview: '对象: url',
      },
      {
        key: 'url',
        path: '$.ad_monitor_url[0].click_url.url',
        preview: '对象: mid',
      },
    ]);
    expect(info?.commandFieldCount).toBe(8);
  });

  it('将静态素材 URL 字段从 CMD 线索中分离', () => {
    const decoded = JSON.stringify({
      video_url: {
        pd: '100',
        cm: '1501',
      },
      button_icon: 'https://static.example.com/open.png',
      tail_frame: {
        poster_image: {
          width: 720,
        },
        swipe_up_lottie: 'https://static.example.com/swipe.zip',
        panel_scheme: {
          url: {
            sku: '101',
          },
        },
      },
    });

    const info = extractSchemeCommandSummaryInfo(decoded, true);

    expect(info?.commandFields).toEqual(['panel_scheme', 'url']);
    expect(info?.resourceFields).toEqual(['video_url', 'button_icon', 'poster_image', 'swipe_up_lottie']);
    expect(info?.commandFieldCount).toBe(2);
    expect(info?.resourceFieldCount).toBe(4);
    expect(info?.resourceFieldRows.map(row => ({
      key: row.key,
      path: row.path,
      preview: row.preview,
    }))).toEqual([
      {
        key: 'video_url',
        path: '$.video_url',
        preview: '对象: pd, cm',
      },
      {
        key: 'button_icon',
        path: '$.button_icon',
        preview: 'https://static.example.com/open.png',
      },
      {
        key: 'poster_image',
        path: '$.tail_frame.poster_image',
        preview: '对象: width',
      },
      {
        key: 'swipe_up_lottie',
        path: '$.tail_frame.swipe_up_lottie',
        preview: 'https://static.example.com/swipe.zip',
      },
    ]);
  });

  it('可提取不带详情行的轻量 CMD 摘要', () => {
    const decoded = JSON.stringify({
      panel: {
        panel_cmd: {
          params: {
            appUrl: {
              params: {
                url: {
                  sku: '101',
                },
              },
            },
          },
        },
      },
      common_info: {
        callbackUrl: {
          clickId: '__CLICK_ID__',
        },
      },
    });

    const info = extractSchemeCommandSummaryInfo(decoded, true, undefined, {
      includeCommandFieldRows: false,
    });

    expect(info?.commandFields).toEqual(['panel_cmd', 'appUrl', 'url', 'callbackUrl']);
    expect(info?.commandFieldCount).toBe(4);
    expect(info?.commandFieldRows).toEqual([]);
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
      commandSchemaCount: 0,
      topCommandSchemas: [],
      commandFields: [],
      commandFieldRows: [],
      commandFieldCount: 0,
      resourceFields: [],
      resourceFieldRows: [],
      resourceFieldCount: 0,
      extFields: [],
      extFieldCount: 0,
      base64SuffixFields: ['os', 'ip'],
      base64SuffixFieldCount: 2,
    });
  });

  it('导出 cmdHandler 风格的 CMD 结构', () => {
    const nestedSource = 'sampleapp://v1/panel?ext_info=%7B%22user_id%22%3A%22u1%22%7D';
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
      'sampleapp://v7/vendor/ad/deeplink',
      `sampleapp://v7/vendor/ad/deeplink?params=%7B%7D&panel_scheme=${encodeURIComponent(nestedSource)}`
    ))).toEqual({
      result: {
        cmdSchema: 'sampleapp://v7/vendor/ad/deeplink',
        cmdParams: {
          params: {
            appUrl: {
              source: 'feedna',
            },
          },
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              ext_info: {
                user_id: 'u1',
              },
            },
            source: nestedSource,
          },
        },
        source: `sampleapp://v7/vendor/ad/deeplink?params=%7B%7D&panel_scheme=${encodeURIComponent(nestedSource)}`,
      },
    });
  });

  it('导出 CMD 结构时从 source 推断根 cmdSchema', () => {
    const bottomButtonScheme = `samplevendor://vendor/ad/reward?task_params=${encodeURIComponent(JSON.stringify({
      title: 'ok',
    }))}`;
    const source = `samplevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      vid: '123',
      tail_frame: {
        bottom_button_scheme: bottomButtonScheme,
      },
    }))}&token=abc`;
    const decoded = deepDecodeScheme(source);
    const cmdStructure = JSON.parse(
      formatPrimaryCmdHandlerCompatibleResult(decoded.decoded, undefined, source)
    );

    expect(cmdStructure.result.cmdSchema).toBe('samplevendor://vendor/ad/rewardImpl');
    expect(cmdStructure.result.cmdParams.video_info.tail_frame.bottom_button_scheme).toMatchObject({
      cmdSchema: 'samplevendor://vendor/ad/reward',
      cmdParams: {
        task_params: {
          title: 'ok',
        },
      },
    });
  });

  it('导出 CMD 结构时兼容日志里的逗号分隔参数', () => {
    const decoded = JSON.stringify({
      cmd: {
        nid: 123,
      },
      from: 'comma-log',
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      'cmd=%7B%22nid%22%3A123%7D, from=comma-log'
    ))).toMatchObject({
      result: {
        cmdParams: {
          cmd: {
            nid: 123,
          },
          from: 'comma-log',
        },
      },
    });
  });

  it('导出 CMD 结构时兼容 Unicode 转义等号参数', () => {
    const nestedSource = 'sampleapp://v1/panel?from=unicode-equals';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'unicode-equals',
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme\\u003d${encodeURIComponent(nestedSource)}`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'unicode-equals',
            },
            source: nestedSource,
          },
        },
      },
    });
  });

  it('导出 CMD 结构时兼容 HTML 转义等号参数', () => {
    const nestedSource = 'sampleapp://v1/panel?from=html-equals';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'html-equals',
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme&#61;${encodeURIComponent(nestedSource)}`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'html-equals',
            },
            source: nestedSource,
          },
        },
      },
    });
  });

  it('导出 CMD 结构时兼容 HTML 十六进制实体参数', () => {
    const nestedSource = 'sampleapp://v1/panel?from=html-hex';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'html-hex',
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme&#x3D;${encodeURIComponent(nestedSource)}`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'html-hex',
            },
            source: nestedSource,
          },
        },
      },
    });
  });

  it('导出 CMD 结构时兼容换行分隔参数', () => {
    const nestedSource = 'sampleapp://v1/panel?from=line-source';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'line-source',
      },
      from: 'line',
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme=${encodeURIComponent(nestedSource)}\n  from=line`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'line-source',
            },
            source: nestedSource,
          },
          from: 'line',
        },
      },
    });
  });

  it('导出 CMD 结构时兼容日志里的转义换行分隔参数', () => {
    const nestedSource = 'sampleapp://v1/panel?from=escaped-line-source';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'escaped-line-source',
      },
      from: 'escaped-line',
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme=${encodeURIComponent(nestedSource)}\\n  from=escaped-line`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'escaped-line-source',
            },
            source: nestedSource,
          },
          from: 'escaped-line',
        },
      },
    });
  });

  it('导出 CMD 结构时兼容带日志前缀的参数串', () => {
    const nestedSource = 'sampleapp://v1/panel?from=prefix-source';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'prefix-source',
      },
      from: 'log',
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `I/SampleRender: panel_scheme=${encodeURIComponent(nestedSource)}&from=log`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'prefix-source',
            },
            source: nestedSource,
          },
          from: 'log',
        },
      },
    });
  });

  it('导出 CMD 结构时兼容带日志前缀的字段行', () => {
    const nestedSource = 'sampleapp://v1/browser/open?url=https%3A%2F%2Fm.example.com%2Fs%3Fword%3Djson';
    const decoded = JSON.stringify({
      scheme: {
        url: {
          word: 'json',
        },
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `I/SampleRender: scheme = ${nestedSource}`
    ))).toMatchObject({
      result: {
        cmdParams: {
          scheme: {
            cmdSchema: 'sampleapp://v1/browser/open',
            cmdParams: {
              url: {
                word: 'json',
              },
            },
            source: nestedSource,
          },
        },
      },
    });
  });

  it('导出 CMD 结构时兼容 Base64 包裹的 Scheme 参数值', () => {
    const nestedSource = 'sampleapp://v1/panel?from=base64-source';
    const decoded = JSON.stringify({
      panel_scheme: {
        from: 'base64-source',
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `panel_scheme=${base64Encode(nestedSource)}`
    ))).toMatchObject({
      result: {
        cmdParams: {
          panel_scheme: {
            cmdSchema: 'sampleapp://v1/panel',
            cmdParams: {
              from: 'base64-source',
            },
            source: nestedSource,
          },
        },
      },
    });
  });

  it('导出 CMD 结构时包装常见 URL 跳转字段', () => {
    const landingUrl = 'https://pro.m.jd.com/mall/active/page.html?sku=101';
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const source = `sampleapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
    }))}`;
    const decoded = JSON.stringify({
      params: {
        appUrl: {
          params: {
            category: 'jump',
            url: {
              sku: '101',
            },
          },
        },
      },
    });

    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      'sampleapp://v7/vendor/ad/deeplink',
      source
    ))).toMatchObject({
      result: {
        cmdParams: {
          params: {
            appUrl: {
              cmdSchema: 'openapp.jdmobile://virtual',
              cmdParams: {
                params: {
                  url: {
                    sku: '101',
                  },
                },
              },
              source: appUrl,
            },
          },
        },
      },
    });
  });

  it('导出 CMD 结构时包装 schema 字段', () => {
    const schemaSource = 'sampleapp://v1/browser/open?url=https%3A%2F%2Fexample.com%2Fpage%3Fid%3D1';
    const decoded = JSON.stringify({
      schema: {
        url: {
          id: '1',
        },
      },
      from: 'feed',
    });

    expect(extractSchemeCommandSummaryInfo(decoded, true)?.commandFields).toContain('schema');
    expect(JSON.parse(formatCmdHandlerCompatibleResult(
      decoded,
      undefined,
      `schema=${encodeURIComponent(schemaSource)}&from=feed`
    ))).toMatchObject({
      result: {
        cmdParams: {
          schema: {
            cmdSchema: 'sampleapp://v1/browser/open',
            cmdParams: {
              url: {
                id: '1',
              },
            },
            source: schemaSource,
          },
          from: 'feed',
        },
      },
    });
  });

  it('整段 response 导出 CMD 结构时聚焦主入口 Scheme', () => {
    const landingUrl = 'https://example.com/landing?sku=101';
    const nestedPanel = `sampleapp://v1/panel?url=${encodeURIComponent(landingUrl)}`;
    const rootScheme = `samplevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      page_url: landingUrl,
      tail_frame: {
        panel_scheme: nestedPanel,
      },
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
        }],
      },
    });
    const decoded = deepDecodeScheme(response);
    const result = JSON.parse(formatPrimaryCmdHandlerCompatibleResult(
      decoded.decoded,
      undefined,
      response
    ));

    expect(result).toMatchObject({
      result: {
        cmdSchema: 'samplevendor://vendor/ad/rewardImpl',
        cmdParams: {
          video_info: {
            page_url: {
              sku: '101',
            },
            tail_frame: {
              panel_scheme: {
                cmdSchema: 'sampleapp://v1/panel',
                cmdParams: {
                  url: {
                    sku: '101',
                  },
                },
                source: nestedPanel,
              },
            },
          },
        },
        source: rootScheme,
      },
    });
    expect(result.result.cmdParams.data).toBeUndefined();
    expect(result.result.cmdParams.errno).toBeUndefined();
  });

  it('整段 response 可基于原始 source 汇总 Top CMD Schema', () => {
    const landingUrl = 'https://union-click.jd.com/sem.php?source=sample-ads&sku=101';
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`;
    const webUrl = `sampleapp://v1/browser/open?url=${encodeURIComponent(landingUrl)}`;
    const deeplinkCmd = `sampleapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      webUrl,
      source: 'feedna',
    }))}`;
    const rootScheme = `samplevendor://vendor/ad/rewardImpl?convert=${encodeURIComponent(JSON.stringify({
      button_scheme: deeplinkCmd,
    }))}`;
    const response = JSON.stringify({
      errno: 0,
      data: {
        ad_common: {
          scheme: rootScheme,
        },
      },
    });

    const decoded = deepDecodeScheme(response);
    const summary = extractSchemeCommandSummaryInfo(
      decoded.decoded,
      decoded.isJson,
      decoded.schemeInfo,
      { source: response }
    );

    expect(summary).not.toBeNull();
    expect(summary?.commandSchemaCount).toBeGreaterThanOrEqual(4);
    expect(summary?.topCommandSchemas.map(item => item.schema)).toEqual(expect.arrayContaining([
      'samplevendor://vendor/ad/rewardImpl',
      'sampleapp://v7/vendor/ad/deeplink',
      'sampleapp://v1/browser/open',
      'openapp.jdmobile://virtual',
    ]));
    expect(summary?.topCommandSchemas.find(item => item.schema === 'samplevendor://vendor/ad/rewardImpl')).toMatchObject({
      count: 1,
      paths: ['$.data.ad_common.scheme'],
    });

    const cmdStructure = JSON.parse(
      formatPrimaryCmdHandlerCompatibleResult(decoded.decoded, summary?.commandSchema, response)
    );
    expect(cmdStructure.result.cmdSchema).toBe('samplevendor://vendor/ad/rewardImpl');
    expect(cmdStructure.result.cmdParams.convert.button_scheme.cmdSchema).toBe('sampleapp://v7/vendor/ad/deeplink');
  });

  it('非法 JSON 不导出 CMD 结构', () => {
    expect(formatCmdHandlerCompatibleResult('{bad json}', 'sampleapp://v1/open')).toBe('');
  });
});
