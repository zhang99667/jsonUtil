import { describe, expect, it } from 'vitest';
import type { TransformContextReport } from './transformSummary';
import { APP_VERSION_LABEL, APP_VERSION_METADATA } from './appVersion';
import { base64Encode } from './schemeUtils';
import { deepParseWithContext } from './transformations';
import {
  buildTransformContextReport,
  buildTransformReportView,
  formatTransformArchivePackageJsonText,
  formatTransformCmdStructureComparisonPackageText,
  formatTransformCmdStructureReportText,
  formatTransformCollaborationReportText,
  formatTransformContextReportText,
  formatTransformContextSummary,
  formatTransformDiagnosticSummaryText,
  formatTransformIssueRegressionTemplateText,
  formatTransformIssueSampleJsonText,
  formatTransformPathValueReportText,
  formatTransformPlaceholderFillTemplateJsonText,
  formatTransformPlaceholderReportText,
  formatTransformQualitySnapshotJsonText,
  formatTransformQualitySnapshotDeltaText,
  formatTransformReportViewText,
  getTransformDecodedPathCopyText,
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
    expect(formatTransformContextReportText(result.context)).toContain('cmdParams: 2 个顶层参数（cmd, from）');
    expect(formatTransformContextReportText(result.context)).toContain('内部路径: $.cmd.cmd.nid=123');
    expect(report.records[0].originalValue).toBe(`cmd=${cmdPayload}&from=feed`);
    expect(report.records[0].hasCmdStructure).toBe(true);
    expect(report.records[0].commandParamCount).toBe(2);
    expect(report.records[0].commandParamKeys).toEqual(['cmd', 'from']);
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
    expect(JSON.parse(formatTransformCmdStructureComparisonPackageText(report.records[0]))).toEqual({
      schemaVersion: 1,
      kind: 'json-helper-cmd-structure-comparison-package',
      path: '$.cmd',
      actual: {
        result: {
          cmdParams: {
            cmd: {
              nid: 123,
            },
            from: 'feed',
          },
          source: `cmd=${cmdPayload}&from=feed`,
        },
      },
      expected: {},
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
    expect(cmdStructureReportText).toContain('cmdParams: 2 个顶层参数（cmd, from）');
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

  it('内部 CMD 字段计数未聚焦时展示真实总数', () => {
    const nestedCommandSearchFields = Array.from({ length: 200 }, (_, index) => ({
      path: `$.cmd.${index === 0 ? 'panel_cmd' : `field_${index}`}`,
      preview: '对象: params',
      value: { params: { id: index } },
    }));
    const report: TransformContextReport = {
      summary: {
        recordCount: 1,
        stepCounts: {},
        schemeCounts: {
          queryString: 1,
          url: 0,
          base64: 0,
          nonReversible: 0,
        },
        warningCount: 0,
        unresolvedCount: 0,
        placeholderCount: 0,
      },
      coverage: {
        score: 100,
        label: '解析覆盖 100%',
        level: 'success',
        description: '本次未发现待检查线索、性能跳过或运行时占位符。',
        items: [],
      },
      cmdStructureCount: 1,
      nestedCommandFieldCount: 250,
      records: [
        {
          path: '$.cmd',
          labels: ['CMD 参数 · 可回写'],
          insights: ['cmd解析: panel_cmd +249'],
          originalValue: 'cmd={}',
          originalPreview: 'cmd={}',
          decodedPreview: '对象: cmd',
          decodedPaths: [],
          decodedPathCount: 0,
          isDecodedPathCountTruncated: false,
          indexedDecodedPathCount: 0,
          hasMoreDecodedPaths: false,
          nestedCommandFields: nestedCommandSearchFields.slice(0, 8),
          nestedCommandSearchFields,
          indexedNestedCommandFieldCount: 200,
          hasMoreNestedCommandFields: true,
          hasCmdStructure: true,
          nestedCommandFieldCount: 250,
          nestedExtFieldCount: 0,
          nestedBase64SuffixFieldCount: 0,
          stepCount: 1,
          hasNonReversibleScheme: false,
        },
      ],
      warnings: [],
      unresolvedCandidates: [],
      runtimePlaceholderGroups: [],
      runtimePlaceholders: [],
    };

    const fullView = buildTransformReportView(report, '');
    expect(fullView.filteredNestedCommandFieldCount).toBe(250);
    expect(formatTransformReportViewText(report, fullView, '')).toContain('内部CMD字段 250/250');

    const focusedView = buildTransformReportView(report, 'panel_cmd');
    expect(focusedView.filteredNestedCommandFieldCount).toBe(1);
    expect(formatTransformReportViewText(report, focusedView, 'panel_cmd')).toContain('内部CMD字段 1/250');
  });

  it('报告汇总高频内部 CMD 字段分布', () => {
    const primaryCmd = `cmd=${encodeURIComponent(JSON.stringify({
      panel_cmd: { params: { id: 'p1' } },
      appUrl: { params: { id: 'app' } },
      nested: {
        panel_cmd: { params: { id: 'p2' } },
      },
    }))}`;
    const secondaryCmd = `cmd=${encodeURIComponent(JSON.stringify({
      panel_cmd: { params: { id: 'p3' } },
      convert_cmd: { params: { id: 'convert' } },
    }))}`;
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: primaryCmd,
      extra: [{ k: 'secondParam', v: secondaryCmd }],
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.topNestedCommandFields?.slice(0, 4)).toEqual([
      {
        key: 'panel_cmd',
        count: 3,
        recordCount: 2,
        paths: [
          '$.action_cmd.cmd.panel_cmd',
          '$.action_cmd.cmd.nested.panel_cmd',
          '$.extra[0].v.cmd.panel_cmd',
        ],
        hasMorePaths: false,
      },
      {
        key: 'cmd',
        count: 2,
        recordCount: 2,
        paths: [
          '$.action_cmd.cmd',
          '$.extra[0].v.cmd',
        ],
        hasMorePaths: false,
      },
      {
        key: 'appUrl',
        count: 1,
        recordCount: 1,
        paths: ['$.action_cmd.cmd.appUrl'],
        hasMorePaths: false,
      },
      {
        key: 'convert_cmd',
        count: 1,
        recordCount: 1,
        paths: ['$.extra[0].v.cmd.convert_cmd'],
        hasMorePaths: false,
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('内部CMD字段分布:');
    expect(formatTransformContextReportText(result.context)).toContain('- panel_cmd ×3（来源记录 2）');
    expect(buildTransformReportView(report, 'panel_cmd').filteredNestedCommandFieldCount).toBe(3);
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
    expect(report.records[0].commandSchema).toBe('nadcorevendor://vendor/ad/rewardImpl');
    expect(report.records[0].commandParamCount).toBe(1);
    expect(report.records[0].commandParamKeys).toEqual(['video_info']);
    expect(report.records[0].insights).toEqual([
      'cmdSchema: nadcorevendor://vendor/ad/rewardImpl',
      'cmd解析: panel_scheme',
      'ext解析: ad_extra_param, ext_info',
    ]);
    expect(report.topCommandSchemas).toEqual([
      {
        schema: 'nadcorevendor://vendor/ad/rewardImpl',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme'],
        hasMorePaths: false,
      },
      {
        schema: 'nadcorevendor://vendor/ad/rewardWebPanel',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.tail_frame.panel_scheme'],
        hasMorePaths: false,
      },
    ]);
    expect(report.topCommandSchemaOrigins).toEqual([
      {
        origin: 'nadcorevendor://vendor',
        count: 2,
        schemaCount: 2,
        recordCount: 1,
        schemas: [
          'nadcorevendor://vendor/ad/rewardImpl',
          'nadcorevendor://vendor/ad/rewardWebPanel',
        ],
        hasMoreSchemas: false,
      },
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
    expect(formatTransformContextReportText(result.context)).toContain('CMD 来源分布:');
    expect(formatTransformContextReportText(result.context)).toContain(
      '- nadcorevendor://vendor ×2（Schema 2 / 来源记录 1）'
    );
    expect(formatTransformContextReportText(result.context)).toContain('CMD Schema 分布:');
    expect(formatTransformContextReportText(result.context)).toContain(
      '- nadcorevendor://vendor/ad/rewardImpl ×1（来源记录 1）'
    );
    expect(formatTransformContextReportText(result.context)).toContain(
      'CMD Schema路径: $.scheme.video_info.tail_frame.panel_scheme=nadcorevendor://vendor/ad/rewardWebPanel'
    );
    expect(formatTransformContextReportText(result.context)).toContain(
      '解析线索: cmdSchema: nadcorevendor://vendor/ad/rewardImpl；cmd解析: panel_scheme；ext解析: ad_extra_param, ext_info'
    );
    expect(buildTransformReportView(report, 'URL Scheme').records.map(record => record.path)).toEqual(['$.scheme']);
    expect(buildTransformReportView(report, 'rewardImpl').filteredRecordCount).toBe(1);
    const nestedSchemaView = buildTransformReportView(report, 'rewardWebPanel');
    expect(nestedSchemaView.filteredRecordCount).toBe(1);
    expect(nestedSchemaView.records[0].commandSchemaRows).toEqual([
      {
        schema: 'nadcorevendor://vendor/ad/rewardWebPanel',
        path: '$.scheme.video_info.tail_frame.panel_scheme',
        source: panelScheme,
      },
    ]);
    expect(nestedSchemaView.cmdStructureRecords[0].cmdStructureFocusLabel).toBe('CMD Schema');
    expect(nestedSchemaView.cmdStructureRecords[0].cmdStructureFocusCount).toBe(1);
    expect(formatTransformReportViewText(report, nestedSchemaView, 'rewardWebPanel')).toContain(
      'CMD Schema路径: $.scheme.video_info.tail_frame.panel_scheme=nadcorevendor://vendor/ad/rewardWebPanel'
    );
    expect(buildTransformReportView(report, 'nadcorevendor://vendor').filteredRecordCount).toBe(1);
    expect(buildTransformReportView(report, 'ext解析').filteredRecordCount).toBe(1);
    expect(buildTransformReportView(report, '内部CMD字段').filteredNestedCommandFieldCount).toBe(1);
  });

  it('CMD Schema Top 会将静态资源 URL 单独分组', () => {
    const mediaUrl = 'https://static.example.com/video/ad.mp4?pd=100&cm=1501';
    const landingUrl = 'https://example.com/landing?sku=101&bd_vid=abc';
    const scheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      video_url: mediaUrl,
      page_url: landingUrl,
      button_icon: 'https://static.example.com/assets/open.png',
      swipe_up_lottie: 'https://static.example.com/lottie/swipe.zip',
    }))}`;
    const result = deepParseWithContext(JSON.stringify({ scheme }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);
    const reportView = buildTransformReportView(report, '');
    const reportText = formatTransformContextReportText(result.context);
    const diagnosticText = formatTransformDiagnosticSummaryText(report, reportView, '');
    const qualitySnapshot = JSON.parse(formatTransformQualitySnapshotJsonText(report, reportView, ''));
    const record = report.records[0];

    expect(report.topCommandSchemas?.map(group => group.schema)).toEqual(expect.arrayContaining([
      'nadcorevendor://vendor/ad/rewardImpl',
      'https://example.com/landing',
    ]));
    expect(record.insights).toEqual([
      'cmdSchema: nadcorevendor://vendor/ad/rewardImpl',
      'cmd解析: page_url',
      '资源URL: video_url, button_icon, swipe_up_lottie',
    ]);
    expect(report.nestedCommandFieldCount).toBe(1);
    expect(report.nestedResourceFieldCount).toBe(3);
    expect(report.topCommandSchemas?.map(group => group.schema)).not.toContain('https://static.example.com/video/ad.mp4');
    expect(report.topResourceSchemas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: 'https://static.example.com/assets/open.png',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.button_icon'],
        hasMorePaths: false,
      }),
      expect.objectContaining({
        schema: 'https://static.example.com/lottie/swipe.zip',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.swipe_up_lottie'],
        hasMorePaths: false,
      }),
      expect.objectContaining({
        schema: 'https://static.example.com/video/ad.mp4',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.video_url'],
        hasMorePaths: false,
      }),
    ]));
    expect(report.topNestedResourceFields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'button_icon',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.button_icon'],
        hasMorePaths: false,
      }),
      expect.objectContaining({
        key: 'swipe_up_lottie',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.swipe_up_lottie'],
        hasMorePaths: false,
      }),
      expect.objectContaining({
        key: 'video_url',
        count: 1,
        recordCount: 1,
        paths: ['$.scheme.video_info.video_url'],
        hasMorePaths: false,
      }),
    ]));
    expect(buildTransformReportView(report, '资源URL').filteredNestedResourceFieldCount).toBe(3);
    expect(buildTransformReportView(report, 'video_url').records[0].nestedResourceFields).toEqual([
      {
        path: '$.scheme.video_info.video_url',
        preview: '对象: pd, cm',
        value: {
          pd: '100',
          cm: '1501',
        },
      },
    ]);
    expect(buildTransformReportView(report, 'button_icon').records[0].nestedResourceFields).toEqual([
      {
        path: '$.scheme.video_info.button_icon',
        preview: 'https://static.example.com/assets/open.png',
        value: 'https://static.example.com/assets/open.png',
      },
    ]);
    expect(reportText).toContain('CMD Schema 分布:');
    expect(reportText).toContain('静态资源 URL 分布:');
    expect(reportText).toContain('静态资源字段分布:');
    expect(diagnosticText).toContain('全量静态资源 URL Top:');
    expect(diagnosticText).toContain('全量静态资源字段 Top:');
    expect(qualitySnapshot.hotspots.topResourceSchemas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schema: 'https://static.example.com/assets/open.png',
        count: 1,
      }),
      expect.objectContaining({
        schema: 'https://static.example.com/video/ad.mp4',
        count: 1,
      }),
    ]));
    expect(qualitySnapshot.hotspots.topNestedResourceFields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'button_icon',
        count: 1,
      }),
      expect.objectContaining({
        key: 'video_url',
        count: 1,
      }),
    ]));
    expect(qualitySnapshot.hotspots.topResourceSchemas.find((group: { schema: string }) => (
      group.schema === 'https://static.example.com/assets/open.png'
    ))).toMatchObject({
      count: 1,
    });
    expect(qualitySnapshot.hotspots.topCommandSchemas.map((group: { schema: string }) => group.schema)).not.toContain(
      'https://static.example.com/video/ad.mp4'
    );
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
      'cmd解析: bottom_button_scheme, panel_scheme, panel_cmd, appUrl +4',
      'ext解析: ad_extra_param, ext_info, extInfo',
    ]);
    expect(record.nestedCommandFieldCount).toBeGreaterThan(4);
    expect(record.indexedNestedCommandFieldCount).toBe(10);
    expect(record.hasMoreNestedCommandFields).toBe(true);
    expect(record.nestedCommandFields[0]).toEqual({
      path: '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.bottom_button_scheme',
      preview: '对象: task_params',
      value: {
        task_params: {
          task_id: '602',
          ext_policy: {
            sdk_switch: '1',
          },
        },
      },
    });
    expect(getTransformDecodedPathCopyText(record.nestedCommandFields[0])).toBe(
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.bottom_button_scheme = {"task_params":{"task_id":"602","ext_policy":{"sdk_switch":"1"}}}'
    );
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
    const convertBtnView = buildTransformReportView(report, 'convert_btn');
    expect(convertBtnView.filteredNestedCommandFieldCount).toBe(1);
    expect(convertBtnView.records[0].nestedCommandFields).toEqual([
      {
        path: '$.data.video[0].material[0].info[0].ad_common.scheme.reward.stay_cmd.convert_btn',
        preview: '对象: button_cmd',
        value: {
          button_cmd: '__CONVERT_CMD__',
        },
      },
    ]);
    expect(formatTransformPathValueReportText(convertBtnView)).toBe(
      '$.data.video[0].material[0].info[0].ad_common.scheme.reward.stay_cmd.convert_btn = {"button_cmd":"__CONVERT_CMD__"}'
    );
    const focusedConvertBtnCmdStructure = JSON.parse(
      getTransformRecordCmdStructureCopyText(convertBtnView.cmdStructureRecords[0])
    );
    expect(focusedConvertBtnCmdStructure.result.cmdParams.reward.stay_cmd).toMatchObject({
      cmdParams: {
        convert_btn: {
          button_cmd: '__CONVERT_CMD__',
        },
      },
    });
    expect(focusedConvertBtnCmdStructure.result.cmdParams.reward.stay_cmd.cmdParams).not.toHaveProperty('convert_cmd');
    const focusedAppUrlPathValueText = formatTransformPathValueReportText(appUrlView);
    expect(focusedAppUrlPathValueText.split('\n')).toHaveLength(4);
    expect(focusedAppUrlPathValueText).toContain(
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl = {"params":{"category":"jump"'
    );
    expect(focusedAppUrlPathValueText).not.toContain(
      '$.data.video[0].material[0].info[0].ad_common.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params.category = "jump"'
    );
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
        value: 'needle_after_display_limit',
      },
    ]);
    expect(getTransformDecodedPathCopyText(hiddenPathView.records[0].decodedPaths[0])).toBe(
      '$.payload.target_after_display_limit = "needle_after_display_limit"'
    );
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
        value: 'needle_after_search_limit',
      },
    ]);
    expect(getTransformDecodedPathCopyText({ path: '$.payload.empty', preview: 'null', value: null })).toBe(
      '$.payload.empty = null'
    );
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

  it('报告展示业务字段标签并支持筛选', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      extra: [
        {
          k: 'extraParam',
          v: actionCmd,
        },
        {
          key: 'trackingParam',
          v: actionCmd,
        },
        {
          k: 'buttonParam',
          value: actionCmd,
        },
        {
          field: 'contentParam',
          content: actionCmd,
        },
      ],
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.records.map(record => ({
      path: record.path,
      sourceLabel: record.sourceLabel,
      labels: record.labels,
    }))).toEqual([
      {
        path: '$.extra[0].v',
        sourceLabel: 'extraParam',
        labels: ['CMD 参数 · 可回写'],
      },
      {
        path: '$.extra[1].v',
        sourceLabel: 'trackingParam',
        labels: ['CMD 参数 · 可回写'],
      },
      {
        path: '$.extra[2].value',
        sourceLabel: 'buttonParam',
        labels: ['CMD 参数 · 可回写'],
      },
      {
        path: '$.extra[3].content',
        sourceLabel: 'contentParam',
        labels: ['CMD 参数 · 可回写'],
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: extraParam');
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: trackingParam');
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: buttonParam');
    expect(formatTransformContextReportText(result.context)).toContain('业务字段: contentParam');

    const labelView = buildTransformReportView(report, 'extraParam');
    expect(labelView.records.map(record => record.path)).toEqual(['$.extra[0].v']);
    expect(labelView.filteredRecordCount).toBe(1);
    expect(buildTransformReportView(report, 'contentParam').records.map(record => record.path)).toEqual([
      '$.extra[3].content',
    ]);
  });

  it('诊断项展示业务字段标签并支持筛选', () => {
    const rawValue = `raw=${encodeURIComponent(JSON.stringify({ nid: 123 }))}`;
    const unresolvedResult = deepParseWithContext(JSON.stringify({
      extra: [{ key: 'trackingParam', v: rawValue }],
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
        value: `cmd=${encodeURIComponent(JSON.stringify({ button_cmd: '__CONVERT_CMD__' }))}`,
      }],
    }), { autoExpandScheme: true });
    const placeholderReport = buildTransformContextReport(placeholderResult.context);

    expect(placeholderReport.runtimePlaceholders[0]).toMatchObject({
      path: '$.extra[0].value.cmd.button_cmd',
      sourceLabel: 'buttonParam',
    });
    expect(formatTransformContextReportText(placeholderResult.context)).toContain('业务字段: buttonParam');
    expect(buildTransformReportView(placeholderReport, 'buttonParam').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(placeholderReport, '占位符').filteredPlaceholderCount).toBe(1);

    const placeholderFillResult = deepParseWithContext(JSON.stringify({
      extra: [
        {
          k: 'buttonParam',
          value: `cmd=${encodeURIComponent(JSON.stringify({
            button_cmd: '__CONVERT_CMD__',
            panel_cmd: '__WEBPANEL_CMD__',
          }))}`,
        },
        {
          k: 'backupParam',
          value: `cmd=${encodeURIComponent(JSON.stringify({ button_cmd: '__CONVERT_CMD__' }))}`,
        },
      ],
    }), { autoExpandScheme: true });
    const placeholderFillReport = buildTransformContextReport(placeholderFillResult.context);
    const placeholderFillTemplateText = formatTransformPlaceholderFillTemplateJsonText(
      buildTransformReportView(placeholderFillReport, '')
    );
    const placeholderFillTemplate = JSON.parse(placeholderFillTemplateText);

    expect(placeholderFillTemplateText).not.toContain('sourceOriginalValue');
    expect(placeholderFillTemplate).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-runtime-placeholder-fill-template',
      tool: APP_VERSION_METADATA,
      summary: {
        groups: 2,
        visibleOccurrences: 3,
        filteredOccurrences: 3,
        totalOccurrences: 3,
        truncated: false,
      },
      placeholders: {
        __CONVERT_CMD__: '',
        __WEBPANEL_CMD__: '',
      },
    });
    expect(placeholderFillTemplate.placeholderDetails).toEqual([
      expect.objectContaining({
        value: '__CONVERT_CMD__',
        replacement: '',
        count: 2,
        sourceCount: 2,
        sources: [
          expect.objectContaining({
            sourcePath: '$.extra[0].value',
            sourceLabel: 'buttonParam',
            count: 1,
          }),
          expect.objectContaining({
            sourcePath: '$.extra[1].value',
            sourceLabel: 'backupParam',
            count: 1,
          }),
        ],
      }),
      expect.objectContaining({
        value: '__WEBPANEL_CMD__',
        replacement: '',
        count: 1,
        sourceCount: 1,
      }),
    ]);

    const skippedValue = `cmd=${encodeURIComponent(JSON.stringify({ nid: 123 }))}&padding=${'x'.repeat(80)}`;
    const warningResult = deepParseWithContext(JSON.stringify({
      extra: [{ field: 'longParam', content: skippedValue }],
    }), {
      autoExpandScheme: true,
      maxStringDecodeLength: 20,
    });
    const warningReport = buildTransformContextReport(warningResult.context);

    expect(warningReport.warnings[0]).toMatchObject({
      path: '$.extra[0].content',
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

  it('展示 URL 编码解码失败线索', () => {
    const rawValue = 'raw=%E0%A4%A';
    const result = deepParseWithContext(JSON.stringify({
      tracking: rawValue,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);

    expect(report.unresolvedCandidates).toEqual([
      {
        path: '$.tracking',
        originalValue: rawValue,
        message: 'URL 编码内容解码失败，未展开为结构化对象',
        length: rawValue.length,
        preview: rawValue,
        detectedType: 'url-encoded',
        reasonLabel: 'URL 编码解码失败',
        reasonLevel: 'warning',
        nextAction: '检查该字段是否包含半截 UTF-8、孤立百分号或被日志截断的编码片段；可复制原始值单独确认来源。',
      },
    ]);
    expect(formatTransformContextReportText(result.context)).toContain('原因: URL 编码解码失败');
    expect(formatTransformContextReportText(result.context)).toContain('下一步: 检查该字段是否包含半截 UTF-8');
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
    expect(report.coverage).toMatchObject({
      score: 100,
      label: '结构解析完成 · 占位符 1',
      level: 'info',
      description: '已展开当前可解析结构，但仍有 1 个运行时占位符需要服务端或客户端替换。',
    });
    expect(report.coverage.items).toContain('占位符不是解析失败，可筛选占位符查看待替换字段');
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
    expect(formatTransformContextReportText(result.context)).toContain('结构解析完成 · 占位符 1');
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
    expect(filteredText).toContain('筛选结果: 展开 1/2，内部CMD字段 1/2，资源字段 0/0，占位符 1/4，待检查 0/0，跳过 0/0');
    expect(filteredText).toContain('- $.extra[0].v: CMD 参数 · 可回写');
    expect(filteredText).toContain('- __CONVERT_CMD__ ×1:');
    expect(filteredText).toContain('业务字段: extraParam');
    expect(filteredText).toContain('$.extra[0].v.cmd.third');
    expect(filteredText).not.toContain('$.action_cmd.cmd.first');
  });

  it('诊断项筛选先匹配结构化字段并保留长原文兜底', () => {
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
        warningCount: 1,
        unresolvedCount: 1,
        placeholderCount: 1,
      },
      summaryText: '深度解析: 展开 0 处，占位符 1',
      coverage: {
        score: 100,
        label: '运行时占位符 1',
        level: 'info',
        description: '已展开当前可解析结构，但仍有 1 个运行时占位符需要服务端或客户端替换。',
        items: [
          '占位符不是解析失败，可筛选占位符查看待替换字段',
          '复制来源路径可回到原始 CMD/Scheme 字段排查',
        ],
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      records: [],
      warnings: [
        {
          type: 'string_decode_skipped',
          path: '$.large_action',
          originalValue: longSourceValue,
          message: '字符串过长，已跳过递归展开以保护性能',
          length: longSourceValue.length,
          limit: 20,
          reasonLabel: '单字段长度保护',
          nextAction: '该字段本身超过自动解析阈值，可复制路径定位后单独粘贴到 Scheme 面板，或缩小 response 后再深度解析。',
        },
      ],
      unresolvedCandidates: [
        {
          path: '$.raw_action',
          originalValue: longSourceValue,
          message: 'URL 编码内容已解码，但未展开为结构化对象',
          length: longSourceValue.length,
          preview: 'raw action preview',
          detectedType: 'url-encoded',
          reasonLabel: '已解码但未结构化',
          reasonLevel: 'info',
          nextAction: '定位该字段确认是否只是普通埋点参数；如果它应继续拆成对象，可把原始值加入 CMD 解析样本。',
        },
      ],
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
    expect(buildTransformReportView(report, 'panel_cmd').filteredWarningCount).toBe(0);
    expect(buildTransformReportView(report, 'panel_cmd').filteredUnresolvedCount).toBe(0);
    expect(buildTransformReportView(report, 'source_tail_needle').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(report, 'source_tail_needle').filteredWarningCount).toBe(1);
    expect(buildTransformReportView(report, 'source_tail_needle').filteredUnresolvedCount).toBe(1);
    expect(buildTransformReportView(report, 'panel_cmd=').filteredPlaceholderCount).toBe(1);
    expect(buildTransformReportView(report, 'panel_cmd=').filteredWarningCount).toBe(1);
    expect(buildTransformReportView(report, 'panel_cmd=').filteredUnresolvedCount).toBe(1);
  });

  it('问题样本支持复制结构化 JSON 用于沉淀回归', () => {
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
        warningCount: 1,
        unresolvedCount: 1,
        placeholderCount: 1,
      },
      summaryText: '深度解析: 待检查 1，跳过 1，占位符 1',
      coverage: {
        score: 50,
        label: '解析覆盖 50%',
        level: 'warning',
        description: '还有疑似结构化内容未完全展开。',
        items: ['保留原始值补充解析样本'],
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      records: [],
      warnings: [
        {
          type: 'string_decode_skipped',
          path: '$.huge',
          sourceLabel: 'hugeParam',
          originalValue: 'cmd=' + 'x'.repeat(40),
          message: '字符串过长，已跳过递归展开以保护性能',
          length: 44,
          limit: 20,
          reasonLabel: '单字段长度保护',
          nextAction: '单独粘贴到 Scheme 面板。',
        },
      ],
      unresolvedCandidates: [
        {
          path: '$.tracking',
          sourceLabel: 'trackingParam',
          originalValue: 'raw=%7B%22nid%22%3A123%7D',
          message: 'URL 编码内容已解码，但未展开为结构化对象',
          length: 31,
          preview: 'raw={"nid":123}',
          detectedType: 'url-encoded',
          reasonLabel: '已解码但未结构化',
          reasonLevel: 'info',
          nextAction: '把原始值加入 CMD 解析样本。',
        },
      ],
      runtimePlaceholderGroups: [],
      runtimePlaceholders: [
        {
          path: '$.button.cmd',
          sourcePath: '$.button',
          sourceLabel: 'buttonParam',
          sourceOriginalValue: 'button_cmd=__CONVERT_CMD__',
          sourceOriginalPreview: 'button_cmd=__CONVERT_CMD__',
          value: '__CONVERT_CMD__',
          description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
        },
      ],
    };

    const jsonText = formatTransformIssueSampleJsonText(buildTransformReportView(report, ''));
    const parsed = JSON.parse(jsonText);

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-transform-issue-samples',
      tool: APP_VERSION_METADATA,
      summary: {
        unresolved: { copied: 1, filtered: 1, total: 1, truncated: false },
        runtimePlaceholders: { copied: 1, filtered: 1, total: 1, truncated: false },
        warnings: { copied: 1, filtered: 1, total: 1, truncated: false },
      },
    });
    expect(parsed.samples).toEqual([
      expect.objectContaining({
        type: 'unresolved',
        path: '$.tracking',
        sourceLabel: 'trackingParam',
        detectedType: 'url-encoded',
        reasonLabel: '已解码但未结构化',
        originalValue: 'raw=%7B%22nid%22%3A123%7D',
      }),
      expect.objectContaining({
        type: 'runtime_placeholder',
        path: '$.button.cmd',
        sourcePath: '$.button',
        value: '__CONVERT_CMD__',
        originalValue: 'button_cmd=__CONVERT_CMD__',
      }),
      expect.objectContaining({
        type: 'warning',
        path: '$.huge',
        sourceLabel: 'hugeParam',
        warningType: 'string_decode_skipped',
        limit: 20,
      }),
    ]);

    const regressionTemplateText = formatTransformIssueRegressionTemplateText(buildTransformReportView(report, ''));
    expect(regressionTemplateText).toContain("import { describe, it } from 'vitest';");
    expect(regressionTemplateText).toContain('// 由深度解析报告「复制回归模板」生成；把 it.todo 改成 it 后补充解析断言。');
    expect(regressionTemplateText).toContain('"type": "unresolved"');
    expect(regressionTemplateText).toContain('"type": "runtime_placeholder"');
    expect(regressionTemplateText).toContain('"type": "warning"');
    expect(regressionTemplateText).toContain('it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);');
  });

  it('问题样本 JSON 支持脱敏敏感原始值', () => {
    const rawValue = `task_params=${encodeURIComponent(JSON.stringify({
      token: 'real-token',
      sign: 'real-sign',
      task_id: '602',
    }))}`;
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
        unresolvedCount: 1,
        placeholderCount: 0,
      },
      summaryText: '深度解析: 待检查 1',
      coverage: {
        score: 80,
        label: '解析覆盖 80%',
        level: 'warning',
        description: '还有疑似结构化内容未完全展开。',
        items: [],
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      records: [],
      warnings: [],
      unresolvedCandidates: [
        {
          path: '$.reward',
          sourceLabel: 'rewardParam',
          originalValue: rawValue,
          message: 'URL 编码内容已解码，但未展开为结构化对象',
          length: rawValue.length,
          preview: 'task_params={"token":"real-token"}',
          detectedType: 'url-encoded',
          reasonLabel: '已解码但未结构化',
          reasonLevel: 'info',
          nextAction: '把原始值加入 CMD 解析样本。',
        },
      ],
      runtimePlaceholderGroups: [],
      runtimePlaceholders: [],
    };

    const jsonText = formatTransformIssueSampleJsonText(
      buildTransformReportView(report, ''),
      { redactSensitiveValues: true }
    );
    const parsed = JSON.parse(jsonText);

    expect(jsonText).not.toContain('real-token');
    expect(jsonText).not.toContain('%22token%22');
    expect(parsed.samples).toEqual([
      expect.objectContaining({
        path: '$.reward',
        originalValue: '[REDACTED: token/sign]',
        redactionHint: '原始值已脱敏，命中: token/sign',
      }),
    ]);

    const regressionTemplateText = formatTransformIssueRegressionTemplateText(
      buildTransformReportView(report, ''),
      { redactSensitiveValues: true }
    );
    expect(regressionTemplateText).not.toContain('real-token');
    expect(regressionTemplateText).not.toContain('%22token%22');
    expect(regressionTemplateText).toContain('已脱敏命中的 originalValue');
    expect(regressionTemplateText).toContain('"originalValue": "[REDACTED: token/sign]"');
  });

  it('诊断摘要输出覆盖结论和 Top 线索但不暴露原始大字段', () => {
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
        warningCount: 1,
        unresolvedCount: 1,
        placeholderCount: 1,
      },
      summaryText: '深度解析: 待检查 1，跳过 1，占位符 1',
      coverage: {
        score: 50,
        label: '解析覆盖 50%',
        level: 'warning',
        description: '还有疑似结构化内容未完全展开。',
        items: ['保留原始值补充解析样本'],
      },
      cmdStructureCount: 0,
      nestedCommandFieldCount: 0,
      topCommandSchemas: [
        {
          schema: 'baiduboxapp://v7/vendor/ad/deeplink',
          count: 3,
          recordCount: 2,
          paths: ['$.scheme.convert_cmd'],
          hasMorePaths: false,
        },
      ],
      topNestedCommandFields: [
        {
          key: 'panel_cmd',
          count: 2,
          recordCount: 1,
          paths: ['$.scheme.panel.panel_cmd'],
          hasMorePaths: false,
        },
      ],
      records: [],
      warnings: [
        {
          type: 'string_decode_skipped',
          path: '$.huge',
          sourceLabel: 'hugeParam',
          originalValue: 'cmd=' + 'x'.repeat(40),
          message: '字符串过长，已跳过递归展开以保护性能',
          length: 44,
          limit: 20,
          reasonLabel: '单字段长度保护',
          nextAction: '单独粘贴到 Scheme 面板。',
        },
      ],
      unresolvedCandidates: [
        {
          path: '$.tracking',
          sourceLabel: 'trackingParam',
          originalValue: 'raw=%7B%22nid%22%3A123%7D',
          message: 'URL 编码内容已解码，但未展开为结构化对象',
          length: 31,
          preview: 'raw={"nid":123}',
          detectedType: 'url-encoded',
          reasonLabel: '已解码但未结构化',
          reasonLevel: 'info',
          nextAction: '把原始值加入 CMD 解析样本。',
        },
      ],
      runtimePlaceholderGroups: [],
      runtimePlaceholders: [
        {
          path: '$.button.cmd',
          sourcePath: '$.button',
          sourceLabel: 'buttonParam',
          sourceOriginalValue: 'button_cmd=__CONVERT_CMD__',
          sourceOriginalPreview: 'button_cmd=__CONVERT_CMD__',
          value: '__CONVERT_CMD__',
          description: '运行时转换 CMD 占位符，当前文本未包含实际 CMD 内容',
        },
      ],
    };

    const summaryText = formatTransformDiagnosticSummaryText(report, buildTransformReportView(report, ''), '');

    expect(summaryText).toContain('深度解析诊断摘要');
    expect(summaryText).toContain(`工具版本: ${APP_VERSION_LABEL}`);
    expect(summaryText).toContain('覆盖: 解析覆盖 50%，还有疑似结构化内容未完全展开。');
    expect(summaryText).toContain('规模: 展开 0/0，CMD结构 0/0，内部CMD字段 0/0，资源字段 0/0，占位符 1/1，待检查 1/1，跳过 1/1');
    expect(summaryText).toContain('- baiduboxapp://v7/vendor/ad/deeplink ×3（来源记录 2）');
    expect(summaryText).toContain('- panel_cmd ×2（来源记录 1）');
    expect(summaryText).toContain('- __CONVERT_CMD__ ×1（来源 1）');
    expect(summaryText).toContain('- $.tracking · trackingParam · url-encoded: 已解码但未结构化');
    expect(summaryText).toContain('- $.huge · hugeParam: 单字段长度保护 (44/20)');
    expect(summaryText).toContain('- 对待检查项判断是否为规则缺口；确认后可复制样本 JSON 并生成回归模板');
    expect(summaryText).not.toContain('raw=%7B%22nid%22%3A123%7D');
    expect(summaryText).not.toContain('button_cmd=__CONVERT_CMD__');
    expect(summaryText).not.toContain('cmd=xxxxxxxx');

    const qualitySnapshotText = formatTransformQualitySnapshotJsonText(report, buildTransformReportView(report, ''), '');
    const qualitySnapshot = JSON.parse(qualitySnapshotText);

    expect(qualitySnapshot).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-transform-quality-snapshot',
      tool: APP_VERSION_METADATA,
      filter: '全部',
      coverage: {
        score: 50,
        level: 'warning',
      },
      totals: {
        records: 0,
        cmdStructures: 0,
        nestedCommandFields: 0,
        runtimePlaceholders: 1,
        unresolved: 1,
        warnings: 1,
      },
      filtered: {
        runtimePlaceholders: 1,
        unresolved: 1,
        warnings: 1,
      },
    });
    expect(qualitySnapshot.hotspots.topCommandSchemas[0]).toMatchObject({
      schema: 'baiduboxapp://v7/vendor/ad/deeplink',
      count: 3,
    });
    expect(qualitySnapshot.hotspots.unresolvedReasons).toEqual([
      { key: '已解码但未结构化', count: 1, paths: ['$.tracking'] },
    ]);
    expect(qualitySnapshot.hotspots.warningTypes).toEqual([
      { key: 'string_decode_skipped', count: 1, paths: ['$.huge'] },
    ]);
    expect(qualitySnapshot.hotspots.runtimePlaceholders).toEqual([
      { key: '__CONVERT_CMD__', count: 1, paths: ['$.button'] },
    ]);
    expect(qualitySnapshot.recommendations).toEqual(expect.arrayContaining([
      expect.stringContaining('待检查项'),
      expect.stringContaining('占位符'),
    ]));
    expect(qualitySnapshotText).not.toContain('raw=%7B%22nid%22%3A123%7D');
    expect(qualitySnapshotText).not.toContain('button_cmd=__CONVERT_CMD__');
    expect(qualitySnapshotText).not.toContain('cmd=xxxxxxxx');
  });

  it('协作排查报告合并质量要点和 cmdHandler 对齐信息', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
      nid: 123,
      category: 'jump',
    }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: actionCmd,
      button_cmd: '__CONVERT_CMD__',
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);
    const reportView = buildTransformReportView(report, '');
    const reportText = formatTransformCollaborationReportText(report, reportView, '');

    expect(reportText).toContain('深度解析协作排查报告');
    expect(reportText).toContain(`工具版本: ${APP_VERSION_LABEL}`);
    expect(reportText).toContain('一、诊断摘要');
    expect(reportText).toContain('二、质量快照要点');
    expect(reportText).toContain('三、cmdHandler 对齐');
    expect(reportText).toContain('待对比: 当前筛选有 1/1 条可复制 CMD 结构');
    expect(reportText).toContain('$.action_cmd');
    expect(reportText).toContain('运行时占位符按来源路径确认真实替换链路');
    expect(reportText).not.toContain(actionCmd);

    const reportWithDiffText = formatTransformCollaborationReportText(report, reportView, '', {
      cmdComparisonReportText: 'CMD 结构差异报告\n- 缺失路径 1 个:\n  - $.cmd.extra',
    });

    expect(reportWithDiffText).toContain('已附当前页面内 cmdHandler 差异报告');
    expect(reportWithDiffText).toContain('CMD 结构差异报告');
    expect(reportWithDiffText).toContain('缺失路径 1 个');
  });

  it('归档包合并质量快照和安全沉淀清单', () => {
    const actionCmd = `cmd=${encodeURIComponent(JSON.stringify({
      nid: 123,
      token: 'secret-token',
      button_cmd: '__CONVERT_CMD__',
    }))}&from=feed`;
    const result = deepParseWithContext(JSON.stringify({
      action_cmd: actionCmd,
    }), { autoExpandScheme: true });
    const report = buildTransformContextReport(result.context);
    const reportView = buildTransformReportView(report, '');
    const archivePackageText = formatTransformArchivePackageJsonText(report, reportView, '', {
      sampleName: 'reward-response',
      cmdComparisonReportText: 'CMD 结构差异报告\n- 缺失路径 1 个:\n  - $.cmd.extra',
    });
    const archivePackage = JSON.parse(archivePackageText);

    expect(archivePackage).toMatchObject({
      schemaVersion: 1,
      kind: 'json-helper-transform-archive-package',
      tool: APP_VERSION_METADATA,
      filter: '全部',
      safety: {
        containsRawResponse: false,
        issueSampleOriginalValues: 'omitted-or-redacted',
        placeholderSourcePreviews: false,
        cmdComparisonMayContainValues: true,
      },
      artifacts: {
        qualitySnapshot: {
          kind: 'json-helper-transform-quality-snapshot',
          tool: APP_VERSION_METADATA,
        },
        issueSamples: {
          tool: APP_VERSION_METADATA,
        },
        placeholderFillTemplate: {
          kind: 'json-helper-runtime-placeholder-fill-template',
          tool: APP_VERSION_METADATA,
        },
      },
      corpusCandidate: {
        recommendedFiles: [
          'reward-response.redacted.json',
          'reward-response.expected.snapshot.json',
          'reward-response.cmdhandler.expected.json',
        ],
      },
    });
    expect(archivePackage.artifacts.diagnosticSummaryText).toContain('深度解析诊断摘要');
    expect(archivePackage.artifacts.diagnosticSummaryText).toContain(`工具版本: ${APP_VERSION_LABEL}`);
    expect(archivePackage.artifacts.collaborationReportText).toContain('深度解析协作排查报告');
    expect(archivePackage.artifacts.cmdComparisonReportText).toContain('缺失路径 1 个');
    expect(archivePackage.artifacts.issueSamples.samples[0].originalValue).not.toBe(actionCmd);
    expect(JSON.stringify(archivePackage)).not.toContain(actionCmd);
    expect(JSON.stringify(archivePackage.artifacts.placeholderFillTemplate)).not.toContain('sourceOriginalPreview');
  });

  it('质量快照对比摘要展示关键指标变化', () => {
    const beforeReport = buildTransformContextReport(deepParseWithContext(JSON.stringify({
      button_cmd: '__CONVERT_CMD__',
    }), { autoExpandScheme: true }).context);
    const afterReport = buildTransformContextReport(deepParseWithContext(JSON.stringify({
      button_cmd: 'cmd=%7B%22nid%22%3A123%7D',
    }), { autoExpandScheme: true }).context);
    const beforeSnapshot = JSON.parse(formatTransformQualitySnapshotJsonText(
      beforeReport,
      buildTransformReportView(beforeReport, ''),
      ''
    ));
    const afterSnapshot = JSON.parse(formatTransformQualitySnapshotJsonText(
      afterReport,
      buildTransformReportView(afterReport, ''),
      ''
    ));
    const deltaText = formatTransformQualitySnapshotDeltaText(beforeSnapshot, afterSnapshot);

    expect(deltaText).toContain('深度解析质量对比');
    expect(deltaText).toContain('覆盖率:');
    expect(deltaText).toContain('CMD结构: 0 -> 1 (+1)');
    expect(deltaText).toContain('占位符: 1 -> 0 (-1)');
    expect(deltaText).toContain('Top CMD Schema: (无) ->');
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
