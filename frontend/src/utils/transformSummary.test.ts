import { describe, expect, it } from 'vitest';
import type { TransformContextReport } from './transformSummary';
import { base64Encode } from './schemeUtils';
import { deepParseWithContext } from './transformations';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformCmdStructureReportText,
  formatTransformContextReportText,
  formatTransformContextSummary,
  formatTransformPathValueReportText,
  formatTransformPlaceholderReportText,
  formatTransformReportViewText,
  getTransformRecordCmdStructureCopyText,
  summarizeTransformContext,
} from './transformSummary';

describe('transformSummary', () => {
  it('统计深度格式化中的 Scheme、嵌套 JSON 和不可逆 Base64', () => {
    const cmdPayload = encodeURIComponent(JSON.stringify({ nid: 123 }));
    const base64Payload = `AFD8f${base64Encode('meg_name":"AI","flag":true}')}`;
    const input = JSON.stringify({
      cmd: `cmd=${cmdPayload}&from=feed`,
      payload: JSON.stringify({ nested: true }),
      extra: base64Payload,
    });

    const result = deepParseWithContext(input, { autoExpandScheme: true });
    const summary = summarizeTransformContext(result.context);

    expect(summary).toMatchObject({
      recordCount: 3,
      stepCounts: {
        scheme_decode: 2,
        json_parse: 1,
      },
      schemeCounts: {
        queryString: 1,
        url: 0,
        base64: 1,
        nonReversible: 1,
      },
      warningCount: 0,
    });
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 3 处，Scheme 2 (CMD 1 / Base64 1)，嵌套 JSON 1，不可逆 1'
    );

    const report = buildTransformContextReport(result.context);
    expect(report.coverage).toMatchObject({
      score: 100,
      label: '解析覆盖 100%',
      level: 'success',
    });
    expect(report.cmdStructureCount).toBe(1);
    expect(report.nestedCommandFieldCount).toBe(1);
    expect(report.records.map(record => ({
      path: record.path,
      labels: record.labels,
      insights: record.insights,
      nestedCommandFieldCount: record.nestedCommandFieldCount,
      decodedPreview: record.decodedPreview,
      hasNonReversibleScheme: record.hasNonReversibleScheme,
    }))).toEqual([
      {
        path: '$.cmd',
        labels: ['CMD 参数 · 可回写'],
        insights: ['cmd解析: cmd'],
        nestedCommandFieldCount: 1,
        decodedPreview: '对象: cmd, from',
        hasNonReversibleScheme: false,
      },
      {
        path: '$.payload',
        labels: ['嵌套 JSON'],
        insights: [],
        nestedCommandFieldCount: 0,
        decodedPreview: '对象: nested',
        hasNonReversibleScheme: false,
      },
      {
        path: '$.extra',
        labels: ['Base64 · 不可逆'],
        insights: [],
        nestedCommandFieldCount: 0,
        decodedPreview: '对象: meg_name, flag',
        hasNonReversibleScheme: true,
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('$.extra: Base64 · 不可逆');
    expect(formatTransformContextReportText(result.context)).toContain('解析结果: 对象: meg_name, flag');
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: $.cmd.cmd.nid=123');
    expect(report.records[0].originalValue).toBe(`cmd=${cmdPayload}&from=feed`);
    expect(report.records[0].hasCmdStructure).toBe(true);
    expect(report.records[0].cmdStructureCopyText).toBeUndefined();
    expect(JSON.parse(getTransformRecordCmdStructureCopyText(report.records[0]))).toEqual({
      result: {
        cmdParams: {
          cmd: {
            nid: 123,
          },
          from: 'feed',
        },
        source: `cmd=${cmdPayload}&from=feed`,
      },
    });
    expect(report.records[0].decodedPaths).toEqual([
      { path: '$.cmd.cmd.nid', preview: '123', copyText: '$.cmd.cmd.nid = 123' },
      { path: '$.cmd.from', preview: 'feed', copyText: '$.cmd.from = "feed"' },
    ]);
    expect(report.records[2].hasCmdStructure).toBe(false);

    const base64View = buildTransformReportView(report, 'base64');
    expect(base64View.records.map(record => record.path)).toEqual(['$.extra']);
    expect(base64View.filteredRecordCount).toBe(1);
    expect(base64View.filteredCmdStructureCount).toBe(0);
    expect(base64View.totalCmdStructureCount).toBe(1);
    expect(base64View.filteredNestedCommandFieldCount).toBe(0);
    expect(base64View.totalNestedCommandFieldCount).toBe(1);
    expect(buildTransformReportView(report, 'CMD 参数').records.map(record => record.path)).toEqual(['$.cmd']);
    expect(buildTransformReportView(report, '内部CMD字段').records.map(record => record.path)).toEqual(['$.cmd']);
    expect(buildTransformReportView(report, '不可逆').records.map(record => record.path)).toEqual(['$.extra']);

    const decodedValueView = buildTransformReportView(report, 'nested');
    expect(decodedValueView.records.map(record => record.path)).toEqual(['$.payload']);
    expect(decodedValueView.filteredRecordCount).toBe(1);

    const decodedPathView = buildTransformReportView(report, 'cmd.nid');
    expect(decodedPathView.records.map(record => record.path)).toEqual(['$.cmd']);
    expect(decodedPathView.filteredRecordCount).toBe(1);
    expect(decodedPathView.filteredCmdStructureCount).toBe(1);
    expect(decodedPathView.filteredNestedCommandFieldCount).toBe(0);
    expect(decodedPathView.records[0].nestedCommandFields).toEqual([]);
    const cmdStructureReportText = formatTransformCmdStructureReportText(report, decodedPathView, 'cmd.nid');
    expect(cmdStructureReportText).toContain('筛选: cmd.nid');
    expect(cmdStructureReportText).toContain('CMD 结构: 1 条');
    expect(cmdStructureReportText).toContain('路径: $.cmd');
    expect(cmdStructureReportText).toContain('"cmdParams"');
    expect(cmdStructureReportText).toContain('聚焦复制: 已按筛选命中的 1 个内部路径裁剪 cmdParams');
    expect(cmdStructureReportText).not.toContain('内部CMD字段路径:');
    expect(JSON.parse(getTransformRecordCmdStructureCopyText(decodedPathView.cmdStructureRecords[0]))).toEqual({
      result: {
        cmdParams: {
          cmd: {
            nid: 123,
          },
        },
        source: `cmd=${cmdPayload}&from=feed`,
      },
    });
    expect(formatTransformCmdStructureReportText(report, base64View, 'base64')).toBe('');
    const cmdStructureView = buildTransformReportView(report, 'CMD结构');
    expect(cmdStructureView.records.map(record => record.path)).toEqual(['$.cmd']);
    expect(cmdStructureView.filteredCmdStructureCount).toBe(1);

    const limitedView = buildTransformReportView(report, '', { recordLimit: 2 });
    expect(limitedView.records.map(record => record.path)).toEqual(['$.cmd', '$.payload']);
    expect(limitedView.filteredRecordCount).toBe(3);
    expect(limitedView.isRecordTruncated).toBe(true);
  });

  it('CMD 结构复制不受展开记录展示上限影响', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      first: JSON.stringify({ a: 1 }),
      second: JSON.stringify({ b: 2 }),
      action_cmd: actionCmd,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);
    const limitedView = buildTransformReportView(report, '', { recordLimit: 2 });

    expect(limitedView.records.map(record => record.path)).toEqual(['$.first', '$.second']);
    expect(limitedView.filteredCmdStructureCount).toBe(1);
    expect(limitedView.cmdStructureRecords.map(record => record.path)).toEqual(['$.action_cmd']);
    expect(formatTransformCmdStructureReportText(report, limitedView, '')).toContain('路径: $.action_cmd');
    expect(formatTransformCmdStructureReportText(report, limitedView, '')).toContain('"nid": 123');
  });

  it('报告展示 CMD Schema、嵌套 CMD 和 ext 解析线索', () => {
    const extInfo = btoa(JSON.stringify({ user_id: 'u1', cmatch: '1501' }));
    const panelScheme = `nadcorevendor://vendor/ad/rewardWebPanel?ext_info=${encodeURIComponent(extInfo)}`;
    const scheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      ext_log: {
        ad_extra_param: extInfo,
      },
      tail_frame: {
        panel_scheme: panelScheme,
      },
    }))}`;
    const result = deepParseWithContext(JSON.stringify({ scheme }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.nestedCommandFieldCount).toBe(1);
    expect(report.records[0].insights).toEqual([
      'cmdSchema: nadcorevendor://vendor/ad/rewardImpl',
      'cmd解析: panel_scheme',
      'ext解析: ad_extra_param, ext_info',
    ]);
    expect(JSON.parse(getTransformRecordCmdStructureCopyText(report.records[0]))).toMatchObject({
      result: {
        cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
        cmdParams: {
          video_info: {
            tail_frame: {
              panel_scheme: {
                cmdSchema: 'nadcorevendor://vendor/ad/rewardWebPanel',
                cmdParams: {
                  ext_info: {
                    user_id: 'u1',
                    cmatch: '1501',
                  },
                },
                source: panelScheme,
              },
            },
          },
        },
      },
    });
    expect(formatTransformContextReportText(result.context)).toContain(
      '解析线索: cmdSchema: nadcorevendor://vendor/ad/rewardImpl；cmd解析: panel_scheme；ext解析: ad_extra_param, ext_info'
    );
    expect(buildTransformReportView(report, 'URL Scheme').records.map(record => record.path)).toEqual(['$.scheme']);
    expect(buildTransformReportView(report, 'rewardImpl').filteredRecordCount).toBe(1);
    expect(buildTransformReportView(report, 'ext解析').filteredRecordCount).toBe(1);
    expect(buildTransformReportView(report, '内部CMD字段').filteredNestedCommandFieldCount).toBe(1);
  });

  it('报告覆盖真实广告 response 中的多层 CMD 与运行时占位符', () => {
    const extInfo = btoa(JSON.stringify({ user_id: 'u1', cmatch: '1501' }));
    const appUrl = `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: 'https://pro.m.jd.com/mall/active/page.html?sku=101',
    }))}`;
    const deeplinkCmd = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
      appUrl,
      source: 'feedna',
      extInfo,
    }))}`;
    const bottomButtonScheme = `nadcorevendor://vendor/ad/reward?task_params=${encodeURIComponent(JSON.stringify({
      task_id: '602',
      ext_policy: JSON.stringify({ sdk_switch: '1' }),
    }))}`;
    const panelScheme = `nadcorevendor://vendor/ad/rewardWebPanel?ext_info=${encodeURIComponent(extInfo)}&panel_cmd=${encodeURIComponent(deeplinkCmd)}`;
    const stayCmd = `nadcorevendor://vendor/ad/rewardDialog?convert_btn=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
    }))}&convert_cmd=${encodeURIComponent(deeplinkCmd)}`;
    const scheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      ext_log: {
        ad_extra_param: extInfo,
      },
      tail_frame: {
        button_scheme: '__CONVERT_CMD__',
        bottom_button_scheme: bottomButtonScheme,
        panel_scheme: panelScheme,
      },
    }))}&reward=${encodeURIComponent(JSON.stringify({
      stay_cmd: stayCmd,
    }))}&rotation_component=${encodeURIComponent(JSON.stringify({
      click_event_cmd: '__CONVERT_CMD__',
      webpanel_event_cmd: '__WEBPANEL_CMD__',
    }))}`;
    const result = deepParseWithContext(JSON.stringify({
      data: {
        video: [
          {
            material: [
              {
                info: [
                  {
                    ad_common: {
                      scheme,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);
    const record = report.records[0];

    expect(record).toMatchObject({
      path: '$.data.video[0].material[0].info[0].ad_common.scheme',
      labels: ['URL Scheme · 可回写'],
    });
    expect(record.insights).toEqual([
      'cmdSchema: nadcorevendor://vendor/ad/rewardImpl',
      'cmd解析: bottom_button_scheme, panel_scheme, panel_cmd, appUrl +3',
      'ext解析: ad_extra_param, ext_info, extInfo',
    ]);
    expect(record.nestedCommandFieldCount).toBeGreaterThan(4);
    expect(record.indexedNestedCommandFieldCount).toBe(9);
    expect(record.hasMoreNestedCommandFields).toBe(true);
    expect(record.nestedCommandFields[0]).toEqual({
      path: '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.bottom_button_scheme',
      preview: '对象: task_params',
      copyText: '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.bottom_button_scheme = {"task_params":{"task_id":"602","ext_policy":{"sdk_switch":"1"}}}',
    });
    expect(record.nestedCommandFields.map(row => row.path)).toContain(
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl'
    );
    expect(report.nestedCommandFieldCount).toBe(record.nestedCommandFieldCount);
    expect(buildTransformReportView(report, '内部CMD字段').records.map(item => item.path)).toEqual([record.path]);
    const appUrlView = buildTransformReportView(report, 'appUrl');
    expect(appUrlView.filteredNestedCommandFieldCount).toBe(4);
    expect(appUrlView.records[0].nestedCommandFields.map(row => row.path)).toEqual([
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl',
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params.url',
      '$.data.video[0].material[0].info[0].ad_common.scheme.reward.stay_cmd.convert_cmd.params.appUrl',
      '$.data.video[0].material[0].info[0].ad_common.scheme.reward.stay_cmd.convert_cmd.params.appUrl.params.url',
    ]);
    expect(formatTransformContextReportText(result.context)).toContain(
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.bottom_button_scheme=对象: task_params'
    );
    expect(formatTransformCmdStructureReportText(
      report,
      buildTransformReportView(report, '内部CMD字段'),
      '内部CMD字段'
    )).toContain('内部CMD字段: ');
    expect(formatTransformCmdStructureReportText(
      report,
      appUrlView,
      'appUrl'
    )).toContain('内部CMD字段: 4');
    expect(formatTransformCmdStructureReportText(
      report,
      appUrlView,
      'appUrl'
    )).toContain('聚焦复制: 已按筛选命中的 4 个内部 CMD 字段裁剪 cmdParams');
    expect(formatTransformCmdStructureReportText(
      report,
      appUrlView,
      'appUrl'
    )).toContain('内部CMD字段路径: $.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl = 对象: params');
    const focusedAppUrlCmdStructure = JSON.parse(
      getTransformRecordCmdStructureCopyText(appUrlView.cmdStructureRecords[0])
    );
    expect(focusedAppUrlCmdStructure.result.cmdParams.video_info.tail_frame).not.toHaveProperty('bottom_button_scheme');
    expect(focusedAppUrlCmdStructure.result.cmdParams.video_info.tail_frame.panel_scheme).toMatchObject({
      cmdSchema: 'nadcorevendor://vendor/ad/rewardWebPanel',
      cmdParams: {
        panel_cmd: {
          cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
          cmdParams: {
            params: {
              appUrl: {
                cmdSchema: 'openapp.jdmobile://virtual',
              },
            },
          },
        },
      },
    });
    expect(focusedAppUrlCmdStructure.result.cmdParams.reward.stay_cmd).toMatchObject({
      cmdSchema: 'nadcorevendor://vendor/ad/rewardDialog',
      cmdParams: {
        convert_cmd: {
          cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
          cmdParams: {
            params: {
              appUrl: {
                cmdSchema: 'openapp.jdmobile://virtual',
              },
            },
          },
        },
      },
    });
    expect(focusedAppUrlCmdStructure.result.cmdParams.reward.stay_cmd.cmdParams).not.toHaveProperty('convert_btn');
    const categoryView = buildTransformReportView(report, 'category');
    expect(categoryView.filteredNestedCommandFieldCount).toBe(0);
    expect(categoryView.records[0].nestedCommandFields).toEqual([]);
    expect(categoryView.cmdStructureRecords[0].cmdStructureFocusLabel).toBe('内部路径');
    const categoryCmdStructureReportText = formatTransformCmdStructureReportText(
      report,
      categoryView,
      'category'
    );
    expect(categoryCmdStructureReportText).toContain('聚焦复制: 已按筛选命中的 2 个内部路径裁剪 cmdParams');
    expect(categoryCmdStructureReportText).not.toContain('内部CMD字段路径:');
    const focusedCategoryCmdStructure = JSON.parse(
      getTransformRecordCmdStructureCopyText(categoryView.cmdStructureRecords[0])
    );
    expect(focusedCategoryCmdStructure.result.cmdParams.video_info.tail_frame).not.toHaveProperty('bottom_button_scheme');
    expect(focusedCategoryCmdStructure.result.cmdParams.video_info.tail_frame.panel_scheme).toMatchObject({
      cmdParams: {
        panel_cmd: {
          cmdParams: {
            params: {
              appUrl: {
                cmdParams: {
                  params: {
                    category: 'jump',
                  },
                },
              },
            },
          },
        },
      },
    });
    const focusedPanelAppUrlParams = focusedCategoryCmdStructure.result
      .cmdParams.video_info.tail_frame.panel_scheme
      .cmdParams.panel_cmd.cmdParams.params.appUrl
      .cmdParams.params;
    expect(focusedPanelAppUrlParams).not.toHaveProperty('url');
    expect(focusedCategoryCmdStructure.result.cmdParams.reward.stay_cmd).toMatchObject({
      cmdParams: {
        convert_cmd: {
          cmdParams: {
            params: {
              appUrl: {
                cmdParams: {
                  params: {
                    category: 'jump',
                  },
                },
              },
            },
          },
        },
      },
    });
    expect(focusedCategoryCmdStructure.result.cmdParams.reward.stay_cmd.cmdParams).not.toHaveProperty('convert_btn');
    expect(JSON.parse(getTransformRecordCmdStructureCopyText(record))).toMatchObject({
      result: {
        cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
        cmdParams: {
          video_info: {
            tail_frame: {
              bottom_button_scheme: {
                cmdSchema: 'nadcorevendor://vendor/ad/reward',
                cmdParams: {
                  task_params: {
                    task_id: '602',
                    ext_policy: {
                      sdk_switch: '1',
                    },
                  },
                },
                source: bottomButtonScheme,
              },
              panel_scheme: {
                cmdSchema: 'nadcorevendor://vendor/ad/rewardWebPanel',
                cmdParams: {
                  panel_cmd: {
                    cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
                    cmdParams: {
                      params: {
                        appUrl: {
                          cmdSchema: 'openapp.jdmobile://virtual',
                          cmdParams: {
                            params: {
                              category: 'jump',
                              url: {
                                cmdSchema: 'https://pro.m.jd.com/mall/active/page.html',
                                cmdParams: {
                                  sku: '101',
                                },
                                source: 'https://pro.m.jd.com/mall/active/page.html?sku=101',
                              },
                            },
                          },
                          source: appUrl,
                        },
                        source: 'feedna',
                        extInfo: {
                          user_id: 'u1',
                          cmatch: '1501',
                        },
                      },
                    },
                    source: deeplinkCmd,
                  },
                },
                source: panelScheme,
              },
            },
          },
          reward: {
            stay_cmd: {
              cmdSchema: 'nadcorevendor://vendor/ad/rewardDialog',
              cmdParams: {
                convert_btn: {
                  button_cmd: '__CONVERT_CMD__',
                },
                convert_cmd: {
                  cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
                  cmdParams: {
                    params: {
                      appUrl: {
                        cmdSchema: 'openapp.jdmobile://virtual',
                        cmdParams: {
                          params: {
                            category: 'jump',
                            url: {
                              cmdSchema: 'https://pro.m.jd.com/mall/active/page.html',
                              cmdParams: {
                                sku: '101',
                              },
                              source: 'https://pro.m.jd.com/mall/active/page.html?sku=101',
                            },
                          },
                        },
                        source: appUrl,
                      },
                      source: 'feedna',
                      extInfo: {
                        user_id: 'u1',
                        cmatch: '1501',
                      },
                    },
                  },
                  source: deeplinkCmd,
                },
              },
              source: stayCmd,
            },
          },
        },
      },
    });
    expect(report.runtimePlaceholderGroups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
    }))).toEqual([
      {
        value: '__CONVERT_CMD__',
        count: 3,
        sourceCount: 1,
      },
      {
        value: '__WEBPANEL_CMD__',
        count: 1,
        sourceCount: 1,
      },
    ]);
  });

  it('报告展示 Base64 后缀解析线索', () => {
    const suffixQuery = '&os=2&ip=127.0.0.1&ua=okhttp';
    const suffixBytes = [
      ...new TextEncoder().encode(suffixQuery),
      0xff,
    ];
    const extraParam = `AFD8f${base64Encode(JSON.stringify({ meg_name: 'AI' }))}UxM${btoa(
      String.fromCharCode(...suffixBytes)
    )}`;
    const result = deepParseWithContext(JSON.stringify({ extraParam }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].insights).toEqual([
      'Base64 后缀: os, ip, ua',
    ]);
    expect(buildTransformReportView(report, '127.0.0.1').filteredRecordCount).toBe(1);
  });

  it('无转换记录时不展示摘要', () => {
    const result = deepParseWithContext(JSON.stringify({ ok: true }), { autoExpandScheme: true });

    expect(formatTransformContextSummary(result.context)).toBeUndefined();
  });

  it('内部路径展示会限制条数避免大对象刷屏', () => {
    const widePayload = {
      ...Object.fromEntries(
        Array.from({ length: 20 }, (_, index) => [`k${index}`, index])
      ),
      target_after_display_limit: 'needle_after_display_limit',
    };
    const result = deepParseWithContext(JSON.stringify({
      payload: JSON.stringify(widePayload),
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].decodedPaths).toHaveLength(12);
    expect(report.records[0].decodedPaths[0]).toEqual({
      path: '$.payload.k0',
      preview: '0',
      copyText: '$.payload.k0 = 0',
    });
    expect(report.records[0].decodedPaths.some(row => row.path.includes('target_after_display_limit'))).toBe(false);
    expect(report.records[0].hasMoreDecodedPaths).toBe(true);
    expect(report.records[0].decodedPathCount).toBe(21);
    expect(report.records[0].isDecodedPathCountTruncated).toBe(false);
    expect(report.records[0].indexedDecodedPathCount).toBe(21);
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: 还有更多未展示（总计 21 条）');

    const fullPathValueText = formatTransformPathValueReportText(buildTransformReportView(report, ''));
    expect(fullPathValueText).toContain('$.payload.target_after_display_limit = "needle_after_display_limit"');
    expect(fullPathValueText).not.toContain('还有更多内部路径未复制');

    const hiddenPathView = buildTransformReportView(report, 'target_after_display_limit');
    expect(hiddenPathView.records.map(record => record.path)).toEqual(['$.payload']);
    expect(hiddenPathView.filteredRecordCount).toBe(1);
    expect(hiddenPathView.records[0].decodedPathCount).toBe(1);
    expect(hiddenPathView.records[0].isDecodedPathCountTruncated).toBe(false);
    expect(hiddenPathView.records[0].indexedDecodedPathCount).toBe(1);
    expect(hiddenPathView.records[0].decodedPaths).toEqual([
      {
        path: '$.payload.target_after_display_limit',
        preview: 'needle_after_display_limit',
        copyText: '$.payload.target_after_display_limit = "needle_after_display_limit"',
      },
    ]);
    expect(formatTransformReportViewText(report, hiddenPathView, 'target_after_display_limit')).toContain(
      '内部路径: $.payload.target_after_display_limit=needle_after_display_limit'
    );
    expect(formatTransformPathValueReportText(hiddenPathView)).toBe(
      '$.payload.target_after_display_limit = "needle_after_display_limit"'
    );
  });

  it('内部路径搜索索引覆盖真实大对象后段字段', () => {
    const widePayload = {
      ...Object.fromEntries(
        Array.from({ length: 260 }, (_, index) => [`k${index}`, index])
      ),
      target_after_search_limit: 'needle_after_search_limit',
    };
    const result = deepParseWithContext(JSON.stringify({
      payload: JSON.stringify(widePayload),
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].decodedPaths).toHaveLength(12);
    expect(report.records[0].decodedPaths.some(row => row.path.includes('target_after_search_limit'))).toBe(false);
    expect(report.records[0].decodedPathCount).toBe(261);
    expect(report.records[0].indexedDecodedPathCount).toBe(261);

    const hiddenPathView = buildTransformReportView(report, 'target_after_search_limit');
    expect(hiddenPathView.records.map(record => record.path)).toEqual(['$.payload']);
    expect(hiddenPathView.records[0].decodedPaths).toEqual([
      {
        path: '$.payload.target_after_search_limit',
        preview: 'needle_after_search_limit',
        copyText: '$.payload.target_after_search_limit = "needle_after_search_limit"',
      },
    ]);
  });

  it('路径值复制会提示超过索引的内部路径', () => {
    const widePayload = Object.fromEntries(
      Array.from({ length: 1_020 }, (_, index) => [`k${index}`, index])
    );
    const result = deepParseWithContext(JSON.stringify({
      payload: JSON.stringify(widePayload),
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0].decodedPathCount).toBe(1_020);
    expect(report.records[0].indexedDecodedPathCount).toBe(1_000);

    const pathValueText = formatTransformPathValueReportText(buildTransformReportView(report, ''));
    expect(pathValueText).toContain('$.payload.k999 = 999');
    expect(pathValueText).not.toContain('$.payload.k1000 = 1000');
    expect(pathValueText).toContain('... $.payload 还有更多内部路径未复制');
  });

  it('报告展示 k/v 形态字段的业务标签并支持筛选', () => {
    const result = deepParseWithContext(JSON.stringify({
      extra: [
        {
          k: 'extraParam',
          v: `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`,
        },
      ],
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'extraParam',
      labels: ['CMD 参数 · 可回写'],
    });
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: extraParam');

    const labelView = buildTransformReportView(report, 'extraParam');
    expect(labelView.records.map(record => record.path)).toEqual(['$.extra[0].v']);
    expect(labelView.filteredRecordCount).toBe(1);
  });

  it('诊断项展示 k/v 形态字段的业务标签并支持筛选', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const unresolvedResult = deepParseWithContext(JSON.stringify({
      extra: [{ k: 'trackingParam', v: rawValue }],
    }), { autoExpandScheme: true });
    const unresolvedReport = buildTransformContextReport(unresolvedResult.context);

    expect(unresolvedReport.unresolvedCandidates[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'trackingParam',
    });
    expect(formatTransformContextReportText(unresolvedResult.context)).toContain('业务字段: trackingParam');
    expect(buildTransformReportView(unresolvedReport, 'trackingParam').filteredUnresolvedCount).toBe(1);
    expect(buildTransformReportView(unresolvedReport, '待检查').filteredUnresolvedCount).toBe(1);

    const placeholderResult = deepParseWithContext(JSON.stringify({
      extra: [{
        k: 'buttonParam',
        v: `cmd=${encodeURIComponent(JSON.stringify({ button_cmd: '__CONVERT_CMD__' }))}`,
      }],
    }), { autoExpandScheme: true });
    const placeholderReport = buildTransformContextReport(placeholderResult.context);

    expect(placeholderReport.runtimePlaceholders[0]).toMatchObject({
      path: '$.extra[0].v.cmd.button_cmd',
      sourceLabel: 'buttonParam',
    });
    expect(formatTransformContextReportText(placeholderResult.context)).toContain('业务字段: buttonParam');
    expect(buildTransformReportView(placeholderReport, 'buttonParam').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(placeholderReport, '占位符').filteredPlaceholderCount).toBe(1);

    const skippedValue = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const warningResult = deepParseWithContext(JSON.stringify({
      extra: [{ k: 'longParam', v: skippedValue }],
    }), {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });
    const warningReport = buildTransformContextReport(warningResult.context);

    expect(warningReport.warnings[0]).toMatchObject({
      path: '$.extra[0].v',
      sourceLabel: 'longParam',
    });
    expect(formatTransformContextReportText(warningResult.context)).toContain('业务字段: longParam');
    expect(buildTransformReportView(warningReport, 'longParam').filteredWarningCount).toBe(1);
    expect(buildTransformReportView(warningReport, '跳过').filteredWarningCount).toBe(1);
  });

  it('展示疑似未展开的结构化字符串线索', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const result = deepParseWithContext(JSON.stringify({
      tracking: rawValue,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.summary.unresolvedCount).toBe(1);
    expect(report.coverage).toMatchObject({
      score: 50,
      label: '解析覆盖 50%',
      level: 'info',
      description: '还有 1 条疑似结构化内容未完全展开，需要判断是普通文本还是规则缺口。',
    });
    expect(report.coverage.items).toContain('优先看未展开线索的原因标签和下一步建议');
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 1 处，URL 解码 1，待检查 1'
    );
    expect(report.unresolvedCandidates).toEqual([
      {
        path: '$.tracking',
        originalValue: rawValue,
        message: 'URL 编码内容已解码，但未展开为结构化对象',
        length: rawValue.length,
        preview: rawValue,
        detectedType: 'url-encoded',
        reasonLabel: '已解码但未结构化',
        reasonLevel: 'info',
        nextAction: '定位该字段确认是否只是普通埋点参数；如果它应继续拆成对象，可把原始值加入 CMD 解析样本。',
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('未展开线索:');
    expect(formatTransformContextReportText(result.context)).toContain('解析覆盖 50%');
    expect(formatTransformContextReportText(result.context)).toContain('原因: 已解码但未结构化');
    expect(formatTransformContextReportText(result.context)).toContain('下一步: 定位该字段确认是否只是普通埋点参数');

    const unresolvedView = buildTransformReportView(report, 'tracking');
    expect(unresolvedView.unresolvedCandidates.map(candidate => candidate.path)).toEqual(['$.tracking']);
    expect(unresolvedView.filteredUnresolvedCount).toBe(1);
    expect(buildTransformReportView(report, '%7B%22nid').filteredUnresolvedCount).toBe(1);
    expect(buildTransformReportView(report, '普通埋点参数').filteredUnresolvedCount).toBe(1);
  });

  it('展示运行时占位符路径和来源', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
    }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: actionCmd,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.summary.placeholderCount).toBe(1);
    expect(formatTransformContextSummary(result.context)).toBe(
      '深度解析: 展开 1 处，Scheme 1 (CMD 1)，占位符 1'
    );
    expect(report.runtimePlaceholders).toEqual([
      {
        path: '$.action_cmd.cmd.button_cmd',
        sourcePath: '$.action_cmd',
        sourceOriginalValue: actionCmd,
        sourceOriginalPreview: actionCmd,
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
      },
    ]);
    expect(report.runtimePlaceholderGroups).toEqual([
      {
        value: '__CONVERT_CMD__',
        description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
        count: 1,
        sourceCount: 1,
        sources: [
          {
            sourcePath: '$.action_cmd',
            sourceOriginalValue: actionCmd,
            sourceOriginalPreview: actionCmd,
            count: 1,
          },
        ],
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('运行时占位符汇总:');
    expect(formatTransformContextReportText(result.context)).toContain('- __CONVERT_CMD__ ×1:');
    expect(formatTransformContextReportText(result.context)).toContain('运行时占位符明细:');
    expect(formatTransformContextReportText(result.context)).toContain(`来源预览: ${actionCmd}`);

    const placeholderView = buildTransformReportView(report, '__CONVERT_CMD__');
    expect(placeholderView.runtimePlaceholders.map(placeholder => placeholder.path)).toEqual([
      '$.action_cmd.cmd.button_cmd',
    ]);
    expect(placeholderView.runtimePlaceholderGroups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
    }))).toEqual([
      {
        value: '__CONVERT_CMD__',
        count: 1,
        sourceCount: 1,
      },
    ]);
    expect(placeholderView.filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(report, '%7B%22button_cmd').filteredPlaceholderCount).toBe(1);

    const placeholderText = formatTransformPlaceholderReportText(report, placeholderView, '__CONVERT_CMD__');
    expect(placeholderText).toContain('筛选: __CONVERT_CMD__');
    expect(placeholderText).toContain('占位符: 1/1');
    expect(placeholderText).toContain('- __CONVERT_CMD__ ×1:');
    expect(placeholderText).toContain('来源数: 1');
    expect(placeholderText).toContain('$.action_cmd.cmd.button_cmd: __CONVERT_CMD__');
    expect(placeholderText).toContain(`来源预览: ${actionCmd}`);
  });

  it('按值和来源汇总重复运行时占位符', () => {
    const primaryCmd = `cmd=${encodeURIComponent(JSON.stringify({
      first: '__CONVERT_CMD__',
      second: '__CONVERT_CMD__',
      webpanel: '__WEBPANEL_CMD__',
    }))}`;
    const extraCmd = `cmd=${encodeURIComponent(JSON.stringify({
      third: '__CONVERT_CMD__',
    }))}`;
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: primaryCmd,
      extra: [{ k: 'extraParam', v: extraCmd }],
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.runtimePlaceholderGroups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
      sources: group.sources.map(source => ({
        sourcePath: source.sourcePath,
        sourceLabel: source.sourceLabel,
        count: source.count,
      })),
    }))).toEqual([
      {
        value: '__CONVERT_CMD__',
        count: 3,
        sourceCount: 2,
        sources: [
          {
            sourcePath: '$.action_cmd',
            sourceLabel: undefined,
            count: 2,
          },
          {
            sourcePath: '$.extra[0].v',
            sourceLabel: 'extraParam',
            count: 1,
          },
        ],
      },
      {
        value: '__WEBPANEL_CMD__',
        count: 1,
        sourceCount: 1,
        sources: [
          {
            sourcePath: '$.action_cmd',
            sourceLabel: undefined,
            count: 1,
          },
        ],
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('- __CONVERT_CMD__ ×3:');
    expect(formatTransformContextReportText(result.context)).toContain('来源数: 2');
    expect(formatTransformContextReportText(result.context)).toContain('extraParam $.extra[0].v ×1');

    const extraView = buildTransformReportView(report, 'extraParam');
    expect(extraView.runtimePlaceholderGroups.map(group => ({
      value: group.value,
      count: group.count,
      sourceCount: group.sourceCount,
    }))).toEqual([
      {
        value: '__CONVERT_CMD__',
        count: 1,
        sourceCount: 1,
      },
    ]);

    const filteredText = formatTransformReportViewText(report, extraView, 'extraParam');
    expect(filteredText).toContain('筛选: extraParam');
    expect(filteredText).toContain('筛选结果: 展开 1/2，内部CMD字段 1/2，占位符 1/4，待检查 0/0，跳过 0/0');
    expect(filteredText).toContain('- $.extra[0].v: CMD 参数 · 可回写');
    expect(filteredText).toContain('- __CONVERT_CMD__ ×1:');
    expect(filteredText).toContain('业务字段: extraParam');
    expect(filteredText).toContain('$.extra[0].v.cmd.third');
    expect(filteredText).not.toContain('$.action_cmd.cmd.first');
  });

  it('占位符筛选先匹配结构化字段并保留长原文兜底', () => {
    const longSourceValue = `${'x'.repeat(8_000)}&panel_cmd=hidden&tail_token=source_tail_needle`;
    const report: TransformContextReport = {
      summary: {
        recordCount: 0,
        stepCounts: {},
        schemeCounts: {
          queryString: 0,
          url: 0,
          base64: 0,
          nonReversible: 0,
        },
        warningCount: 0,
        unresolvedCount: 0,
        placeholderCount: 1,
      },
      summaryText: '深度解析: 展开 0 处，占位符 1',
      coverage: {
        score: 100,
        label: '解析覆盖 100%',
        level: 'info',
        description: '结构解析已完成，但仍有 1 个运行时占位符需要服务端或客户端运行时替换。',
        items: [],
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      records: [],
      warnings: [],
      unresolvedCandidates: [],
      runtimePlaceholderGroups: [],
      runtimePlaceholders: [
        {
          path: '$.button_cmd.cmd',
          sourcePath: '$.button_cmd',
          sourceLabel: 'buttonParam',
          sourceOriginalValue: longSourceValue,
          sourceOriginalPreview: `${longSourceValue.slice(0, 96)}...`,
          value: '__CONVERT_CMD__',
          description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
        },
      ],
    };

    expect(buildTransformReportView(report, '__CONVERT_CMD__').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(report, 'buttonParam').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(report, 'panel_cmd').filteredPlaceholderCount).toBe(0);
    expect(buildTransformReportView(report, 'source_tail_needle').filteredPlaceholderCount).toBe(1);
  });

  it('统计性能保护跳过信息', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const result = deepParseWithContext(JSON.stringify({ action_cmd: actionCmd }), {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });

    expect(formatTransformContextSummary(result.context)).toBe('深度解析: 展开 0 处，跳过 1');
    expect(buildTransformContextReport(result.context).coverage).toMatchObject({
      score: 0,
      label: '解析覆盖 0%',
      level: 'warning',
    });
    expect(formatTransformContextReportText(result.context)).toContain(
      '$.action_cmd: 字符串过长，已跳过递归展开以保护性能'
    );

    const report = buildTransformContextReport(result.context);
    const warningView = buildTransformReportView(report, 'action_cmd');
    expect(warningView.warnings).toEqual([
      {
        type: 'string_decode_skipped',
        path: '$.action_cmd',
        originalValue: actionCmd,
        message: '字符串过长，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
        reasonLabel: '单字段长度保护',
        nextAction: '该字段本身超过自动解析阈值，可复制路径定位后单独粘贴到 Scheme 面板，或缩小 response 后再深度解析。',
      },
    ]);
    expect(warningView.filteredWarningCount).toBe(1);
    expect(formatTransformContextReportText(result.context)).toContain('原因: 单字段长度保护');
    expect(formatTransformContextReportText(result.context)).toContain('下一步: 该字段本身超过自动解析阈值');
    expect(buildTransformReportView(report, 'padding=').filteredWarningCount).toBe(1);
    expect(buildTransformReportView(report, '单独粘贴到 Scheme 面板').filteredWarningCount).toBe(1);
  });

  it('统计累计解析预算耗尽的跳过建议', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      title: 'x'.repeat(16),
      action_cmd: actionCmd,
      next_cmd: actionCmd,
    }), {
      autoExpandScheme: true,
      maxTotalStringDecodeLength: 20,
    });
    const report = buildTransformContextReport(result.context);

    expect(report.warnings).toEqual([
      {
        type: 'string_decode_budget_exceeded',
        path: '$.action_cmd',
        originalValue: actionCmd,
        message: '累计字符串解析预算已用尽，已跳过递归展开以保护性能',
        length: actionCmd.length,
        limit: 20,
        reasonLabel: '累计预算保护',
        nextAction: '优先用 JSONPath 定位目标字段，或只复制该字段到 Scheme 面板单独解析，避免整段 response 的其它长字符串消耗预算。',
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('原因: 累计预算保护');
    expect(buildTransformReportView(report, '其它长字符串消耗预算').filteredWarningCount).toBe(1);
  });
});
