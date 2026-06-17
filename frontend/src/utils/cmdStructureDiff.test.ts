import { describe, expect, it } from 'vitest';
import {
  collectActualCmdStructureCandidates,
  countCmdStructurePathBranches,
  diffCmdStructures,
  formatCmdStructureDiff,
  hasRecognizableCmdStructure,
  normalizeCmdStructure,
  parseCmdStructureJson,
  rankCmdStructureCandidates,
} from './cmdStructureDiff';

const createCmdStructure = () => ({
  result: {
    cmdSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
    cmdParams: {
      params: {
        appUrl: {
          cmdSchema: 'openapp.jdmobile://virtual',
          cmdParams: {
            params: {
              category: 'jump',
              url: {
                cmdSchema: 'https://example.com/landing',
                cmdParams: {
                  sku: '101',
                },
              },
            },
          },
        },
      },
    },
    source: 'baiduboxapp://v7/vendor/ad/deeplink?params=...',
  },
});

const createNestedRewardResponse = () => {
  const rootPath = '$.data.video[0].material[0].info[0].ad_common.scheme';
  const landingUrl = 'https://example.com/landing?sku=101';
  const deeplink = `baiduboxapp://v7/vendor/ad/deeplink?params=${encodeURIComponent(JSON.stringify({
    appUrl: `openapp.jdmobile://virtual?params=${encodeURIComponent(JSON.stringify({
      category: 'jump',
      url: landingUrl,
    }))}`,
    webUrl: `baiduboxapp://v1/easybrowse/open?url=${encodeURIComponent(landingUrl)}`,
  }))}`;
  const panelScheme = `nadcorevendor://vendor/ad/rewardWebPanel?url=${encodeURIComponent(landingUrl)}`;
  const stayCmd = `nadcorevendor://vendor/ad/rewardDialog?convert_cmd=${encodeURIComponent(deeplink)}&main_btn=${encodeURIComponent(JSON.stringify({
    button_cmd: '__CONVERT_CMD__',
  }))}`;
  const rootScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
    tail_frame: {
      panel_scheme: panelScheme,
    },
  }))}&reward=${encodeURIComponent(JSON.stringify({
    stay_cmd: stayCmd,
  }))}&panel=${encodeURIComponent(JSON.stringify({
    panel_cmd: deeplink,
    webpanel_cmd: deeplink,
  }))}`;

  return {
    rootPath,
    response: {
      errno: 0,
      data: {
        video: [{
          material: [{
            info: [{
              ad_common: {
                scheme: rootScheme,
              },
              supportCMD: true,
            }],
          }],
        }],
      },
    },
  };
};

describe('cmdStructureDiff', () => {
  it('兼容 result 和 data 包裹的 cmdHandler 输出', () => {
    const structure = normalizeCmdStructure({
      data: {
        cmdSchema: 'baiduboxapp://v1/open',
        cmdParams: {
          url: 'https://example.com',
        },
      },
    });

    expect(structure).toEqual({
      cmdSchema: 'baiduboxapp://v1/open',
      cmdParams: {
        url: 'https://example.com',
      },
      source: undefined,
    });
  });

  it('兼容内部页面复制出的解析结果包装', () => {
    const structure = normalizeCmdStructure({
      解析结果: {
        result: {
          cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
          cmdParams: {
            video_info: {
              vid: '123',
            },
          },
        },
      },
    });

    expect(structure).toEqual({
      cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      cmdParams: {
        video_info: {
          vid: '123',
        },
      },
      source: undefined,
    });
  });

  it('结构一致时输出一致结论', () => {
    const diff = diffCmdStructures(createCmdStructure(), createCmdStructure());

    expect(diff.hasDifferences).toBe(false);
    expect(formatCmdStructureDiff(diff)).toContain('结构一致');
  });

  it('识别 schema、缺失路径、额外路径和值差异', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();
    const actualParams = actual.result.cmdParams.params.appUrl.cmdParams.params as Record<string, unknown>;
    const expectedParams = expected.result.cmdParams.params.appUrl.cmdParams.params as Record<string, unknown>;

    actual.result.cmdSchema = 'baiduboxapp://v7/vendor/ad/other';
    delete actual.result.cmdParams.params.appUrl.cmdParams.params.url.cmdParams.sku;
    actualParams.category = 'open';
    actualParams.extra = { trace: 'debug' };
    expectedParams.channel = 'feed';

    const diff = diffCmdStructures(actual, expected);
    const report = formatCmdStructureDiff(diff);

    expect(diff.hasDifferences).toBe(true);
    expect(diff.schemaDiff).toEqual({
      actual: 'baiduboxapp://v7/vendor/ad/other',
      expected: 'baiduboxapp://v7/vendor/ad/deeplink',
    });
    expect(diff.missingPaths).toEqual(expect.arrayContaining([
      '$.params.appUrl.cmdParams.params.channel',
      '$.params.appUrl.cmdParams.params.url.cmdParams.sku',
    ]));
    expect(diff.extraPaths).toEqual([
      '$.params.appUrl.cmdParams.params.extra',
      '$.params.appUrl.cmdParams.params.extra.trace',
    ]);
    expect(diff.valueDiffs).toEqual([
      {
        path: '$.params.appUrl.cmdParams.params.category',
        actual: 'open',
        expected: 'jump',
      },
    ]);
    expect(report).toContain('cmdSchema 不一致');
    expect(report).toContain('缺失路径 2 个');
    expect(report).toContain('额外路径 2 个');
    expect(report).toContain('值不一致 1 个');
  });

  it('支持忽略 actual 额外路径以对齐 cmdHandler 子集基线', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();
    const expectedParams = expected.result.cmdParams.params.appUrl.cmdParams.params as Record<string, unknown>;

    delete expectedParams.url;

    const strictDiff = diffCmdStructures(actual, expected);
    const subsetDiff = diffCmdStructures(actual, expected, { ignoreExtraPaths: true });

    expect(strictDiff.hasDifferences).toBe(true);
    expect(strictDiff.extraPaths).toEqual([
      '$.params.appUrl.cmdParams.params.url',
      '$.params.appUrl.cmdParams.params.url.cmdSchema',
      '$.params.appUrl.cmdParams.params.url.cmdParams',
      '$.params.appUrl.cmdParams.params.url.cmdParams.sku',
    ]);
    expect(subsetDiff).toMatchObject({
      hasDifferences: false,
      extraPaths: [],
      ignoredExtraPaths: [
        '$.params.appUrl.cmdParams.params.url',
        '$.params.appUrl.cmdParams.params.url.cmdSchema',
        '$.params.appUrl.cmdParams.params.url.cmdParams',
        '$.params.appUrl.cmdParams.params.url.cmdParams.sku',
      ],
      missingPaths: [],
      valueDiffs: [],
    });
    expect(formatCmdStructureDiff(subsetDiff)).toContain('已忽略 actual 额外路径 4 个');
  });

  it('差异报告会折叠同一额外分支下的子路径', () => {
    const diff = diffCmdStructures({
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          stable: 'ok',
          extra: {
            trace: 'debug',
            nested: {
              token: 'abc',
            },
          },
        },
      },
    }, {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          stable: 'ok',
        },
      },
    });
    const report = formatCmdStructureDiff(diff);

    expect(diff.extraPaths).toEqual([
      '$.extra',
      '$.extra.trace',
      '$.extra.nested',
      '$.extra.nested.token',
    ]);
    expect(report).toContain('额外路径 4 个（折叠为 1 个分支）');
    expect(report).toContain('  - $.extra');
    expect(report).not.toContain('$.extra.nested.token');
  });

  it('可统计折叠后的路径分支数量', () => {
    expect(countCmdStructurePathBranches([
      '$.extra',
      '$.extra.trace',
      '$.extra.nested',
      '$.extra.nested.token',
      '$.other',
    ])).toBe(2);
  });

  it('候选评分会按折叠后的缺失分支数量计算', () => {
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          stable: 'ok',
          branch: {
            title: 'reward',
            nested: {
              id: '123',
            },
          },
        },
      },
    };
    const candidates = rankCmdStructureCandidates([
      {
        id: '$.missing_branch',
        label: '$.missing_branch',
        actual: {
          result: {
            cmdSchema: 'baiduboxapp://v1/panel',
            cmdParams: {
              stable: 'ok',
            },
          },
        },
      },
    ], expected);

    expect(candidates[0].diff.missingPaths).toEqual([
      '$.branch',
      '$.branch.title',
      '$.branch.nested',
      '$.branch.nested.id',
    ]);
    expect(candidates[0].score).toBe(100);
  });

  it('允许 actual 展开 URL 而 cmdHandler expected 保留原字符串', () => {
    const source = 'https://example.com/landing?sku=101';
    const actual = {
      result: {
        cmdSchema: 'baiduboxapp://v1/browser/open',
        cmdParams: {
          url: {
            cmdSchema: 'https://example.com/landing',
            cmdParams: {
              sku: '101',
            },
            source,
          },
        },
      },
    };
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/browser/open',
        cmdParams: {
          url: source,
        },
      },
    };

    const diff = diffCmdStructures(actual, expected, { ignoreExtraPaths: true });

    expect(diff).toMatchObject({
      hasDifferences: false,
      missingPaths: [],
      extraPaths: [],
      valueDiffs: [],
    });
    expect(diff.ignoredExtraPaths).toEqual([
      '$.url.cmdSchema',
      '$.url.cmdParams',
      '$.url.cmdParams.sku',
      '$.url.source',
    ]);
  });

  it('识别 source 单侧缺失差异', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    delete actual.result.source;

    const diff = diffCmdStructures(actual, expected);
    const report = formatCmdStructureDiff(diff);

    expect(diff.sourceDiff).toEqual({
      actual: undefined,
      expected: 'baiduboxapp://v7/vendor/ad/deeplink?params=...',
    });
    expect(report).toContain('source 不一致');
    expect(report).toContain('actual: (空)');
    expect(report).toContain('expected: baiduboxapp://v7/vendor/ad/deeplink?params=...');
  });

  it('source 差异报告会截断超长来源串', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();
    const longActualSource = `baiduboxapp://v7/vendor/ad/deeplink?params=${'a'.repeat(260)}`;
    const longExpectedSource = `baiduboxapp://v7/vendor/ad/deeplink?params=${'b'.repeat(260)}`;

    actual.result.source = longActualSource;
    expected.result.source = longExpectedSource;

    const report = formatCmdStructureDiff(diffCmdStructures(actual, expected));

    expect(report).toContain(`${longActualSource.slice(0, 240)}...`);
    expect(report).toContain(`${longExpectedSource.slice(0, 240)}...`);
    expect(report).not.toContain(longActualSource);
    expect(report).not.toContain(longExpectedSource);
  });

  it('expected 未声明 source 时允许 actual 保留来源串', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    delete expected.result.source;

    const diff = diffCmdStructures(actual, expected);

    expect(diff.sourceDiff).toBeNull();
    expect(diff.hasDifferences).toBe(false);
  });

  it('按差异数量推荐最匹配的 actual CMD 候选', () => {
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          tab: 'reward',
        },
      },
    };
    const candidates = rankCmdStructureCandidates([
      {
        id: '$.action_cmd',
        label: '$.action_cmd',
        commandSchema: 'baiduboxapp://v1/action',
        actual: {
          result: {
            cmdSchema: 'baiduboxapp://v1/action',
            cmdParams: {
              from: 'feed',
            },
          },
        },
      },
      {
        id: '$.panel_cmd',
        label: '$.panel_cmd',
        commandSchema: 'baiduboxapp://v1/panel',
        actual: expected,
      },
    ], expected);

    expect(candidates[0]).toMatchObject({
      id: '$.panel_cmd',
      isExactMatch: true,
      score: 0,
    });
    expect(candidates[1].id).toBe('$.action_cmd');
  });

  it('推荐候选时沿用忽略 actual 额外路径模式', () => {
    const source = 'https://example.com/landing?sku=101';
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/browser/open',
        cmdParams: {
          url: source,
        },
      },
    };
    const candidates = rankCmdStructureCandidates([
      {
        id: '$.browser_cmd',
        label: '$.browser_cmd',
        actual: {
          result: {
            cmdSchema: 'baiduboxapp://v1/browser/open',
            cmdParams: {
              url: {
                cmdSchema: 'https://example.com/landing',
                cmdParams: {
                  sku: '101',
                },
                source,
              },
            },
          },
        },
      },
    ], expected, { ignoreExtraPaths: true });

    expect(candidates[0]).toMatchObject({
      id: '$.browser_cmd',
      isExactMatch: true,
    });
    expect(candidates[0].diff.ignoredExtraPaths).toEqual([
      '$.url.cmdSchema',
      '$.url.cmdParams',
      '$.url.cmdParams.sku',
      '$.url.source',
    ]);
  });

  it('解析带前后文和代码块的 cmdHandler 输出', () => {
    const parsed = parseCmdStructureJson(`cmdHandler 输出:
\`\`\`json
${JSON.stringify(createCmdStructure(), null, 2)}
\`\`\`
复制时间: 2026-06-16`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('解析字符串化 JSON 的 cmdHandler 输出', () => {
    const parsed = parseCmdStructureJson(JSON.stringify(JSON.stringify(createCmdStructure())), 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('解析日志前缀中的首个 JSON 对象', () => {
    const parsed = parseCmdStructureJson(`cmdHandler result => ${JSON.stringify(createCmdStructure())} // done`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('多段日志 JSON 会优先解析可识别的 cmdHandler 结构', () => {
    const parsed = parseCmdStructureJson(`request meta => {"traceId":"abc","errno":0}
cmdHandler result => ${JSON.stringify(createCmdStructure())}
done`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('解析带方括号日志前缀的 cmdHandler 输出', () => {
    const parsed = parseCmdStructureJson(`[cmdHandler] output => ${JSON.stringify(createCmdStructure())}`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('解析内部页面树形可见文本', () => {
    const parsed = parseCmdStructureJson(`Home
"解析结果":{1 item
cmd解析
"result":{2 items
"cmdSchema":"nadcorevendor://vendor/ad/rewardImpl"
"cmdParams":{1 item
"video_info":{1 item
"vid":"123"
}
}
}
}
iqoo13`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual({
      cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      cmdParams: {
        video_info: {
          vid: '123',
        },
      },
      source: undefined,
    });
  });

  it('解析只复制 result 内部的 cmdHandler 树形文本', () => {
    const parsed = parseCmdStructureJson(`cmd解析
"cmdSchema":"nadcorevendor://vendor/ad/rewardImpl"
"cmdParams":{1 item
"video_info":{1 item
"vid":"123"
}
}`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual({
      cmdSchema: 'nadcorevendor://vendor/ad/rewardImpl',
      cmdParams: {
        video_info: {
          vid: '123',
        },
      },
      source: undefined,
    });
  });

  it('解析只复制 cmdParams 子树的 cmdHandler 文本', () => {
    const parsed = parseCmdStructureJson(`"cmdParams":{1 item
"video_info":{1 item
"vid":"123"
}
}`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual({
      cmdSchema: undefined,
      cmdParams: {
        video_info: {
          vid: '123',
        },
      },
      source: undefined,
    });
  });

  it('识别可用于对比的 cmdHandler 输入', () => {
    expect(hasRecognizableCmdStructure({
      解析结果: {
        result: {
          cmdSchema: 'baiduboxapp://v1/browser/open',
          cmdParams: {
            url: 'https://example.com',
          },
        },
      },
    })).toBe(true);
    expect(hasRecognizableCmdStructure({
      解析结果: {
        result: '',
      },
    })).toBe(false);
  });

  it('整段 response 自动聚焦主 CMD 字段', () => {
    const landingUrl = 'https://example.com/landing?sku=101';
    const panelScheme = `baiduboxapp://v1/panel?url=${encodeURIComponent(landingUrl)}`;
    const rootScheme = `nadcorevendor://vendor/ad/rewardImpl?video_info=${encodeURIComponent(JSON.stringify({
      page_url: landingUrl,
      tail_frame: {
        panel_scheme: panelScheme,
      },
    }))}`;
    const parsed = parseCmdStructureJson(JSON.stringify({
      errno: 0,
      data: {
        video: [{
          material: [{
            info: [{
              ad_common: {
                scheme: rootScheme,
              },
              supportCMD: true,
            }],
          }],
        }],
      },
    }), '真实 response');

    const structure = normalizeCmdStructure(parsed);

    expect(structure.cmdSchema).toBe('nadcorevendor://vendor/ad/rewardImpl');
    expect(structure.source).toBe(rootScheme);
    expect(structure.cmdParams).toMatchObject({
      video_info: {
        page_url: {
          cmdSchema: 'https://example.com/landing',
          cmdParams: {
            sku: '101',
          },
          source: landingUrl,
        },
        tail_frame: {
          panel_scheme: {
            cmdSchema: 'baiduboxapp://v1/panel',
            cmdParams: {
              url: {
                cmdSchema: 'https://example.com/landing',
              },
            },
            source: panelScheme,
          },
        },
      },
    });
  });

  it('整段真实 response 候选会暴露解析树里的内层 CMD', () => {
    const { response, rootPath } = createNestedRewardResponse();
    const candidates = collectActualCmdStructureCandidates(response);
    const candidateIds = candidates.map(candidate => candidate.id);

    expect(candidateIds).toEqual(expect.arrayContaining([
      rootPath,
      `${rootPath}.cmdParams.video_info.tail_frame.panel_scheme`,
      `${rootPath}.cmdParams.reward.stay_cmd`,
      `${rootPath}.cmdParams.reward.stay_cmd.cmdParams.convert_cmd`,
      `${rootPath}.cmdParams.panel.panel_cmd`,
      `${rootPath}.cmdParams.panel.webpanel_cmd`,
    ]));
    expect(candidates.find(candidate => candidate.id === `${rootPath}.cmdParams.panel.panel_cmd`)).toMatchObject({
      sourceLabel: 'panel_cmd',
      commandSchema: 'baiduboxapp://v7/vendor/ad/deeplink',
    });
  });

  it('差异报告可附带对比来源上下文', () => {
    const diff = diffCmdStructures(createCmdStructure(), createCmdStructure());
    const report = formatCmdStructureDiff(diff, {
      toolVersionLabel: 'v1.8.20',
      path: '$.action_cmd',
      sourceLabel: 'actionCmd',
      modeLabel: '忽略 actual 额外路径',
    });

    expect(report).toContain('工具版本: v1.8.20');
    expect(report).toContain('对比路径: $.action_cmd');
    expect(report).toContain('业务字段: actionCmd');
    expect(report).toContain('对比模式: 忽略 actual 额外路径');
    expect(report).toContain('结构一致');
  });

  it('解析非法 expected JSON 时给出明确错误', () => {
    expect(() => parseCmdStructureJson('{broken', 'cmdHandler 输出')).toThrow('cmdHandler 输出不是有效 JSON');
  });
});
