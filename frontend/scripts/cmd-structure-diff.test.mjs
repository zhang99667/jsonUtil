import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assertRecognizableCmdInput,
  collectActualCmdStructureCandidates,
  diffCmdStructures,
  extractCmdStructurePair,
  formatCmdStructureCandidateRecommendations,
  formatCmdStructureDiff,
  hasRecognizableCmdStructure,
  normalizeCmdStructure,
  normalizeComparisonInputs,
  parseCliArgs,
  parseCmdHandlerTreeText,
  parseJsonInput,
  prepareComparisonInputs,
  rankCmdStructureCandidates,
} from './cmd-structure-diff.mjs';

const SCRIPT_PATH = fileURLToPath(new URL('./cmd-structure-diff.mjs', import.meta.url));

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

describe('normalizeCmdStructure', () => {
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

  it('解析内部页面树形可见文本', () => {
    const parsed = parseCmdHandlerTreeText(`Home
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
iqoo13`);

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

  it('解析只复制 result 内部的树形文本', () => {
    const parsed = parseCmdHandlerTreeText(`cmd解析
"cmdSchema":"nadcorevendor://vendor/ad/rewardImpl"
"cmdParams":{1 item
"video_info":{1 item
"vid":"123"
}
}`);

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

  it('解析只复制 cmdParams 子树的文本', () => {
    const parsed = parseJsonInput(`"cmdParams":{1 item
"video_info":{1 item
"vid":"123"
}
}`, 'expected');

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

  it('文件输入兼容日志前缀和 Markdown 代码块', () => {
    const parsed = parseJsonInput(`cmdHandler 输出:
\`\`\`json
${JSON.stringify(createCmdStructure())}
\`\`\`
复制时间: 2026-06-17`, 'expected');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('文件输入兼容方括号日志前缀', () => {
    const parsed = parseJsonInput(`[cmdHandler] output => ${JSON.stringify(createCmdStructure())} // done`, 'expected');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
  });

  it('文件输入兼容字符串化 JSON', () => {
    const parsed = parseJsonInput(JSON.stringify(JSON.stringify(createCmdStructure())), 'expected');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
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

    const structure = normalizeCmdStructure({
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
    });

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

  it('识别可对比 CMD 输入并拒绝空解析结果', () => {
    expect(hasRecognizableCmdStructure({
      解析结果: {
        result: {
          cmdSchema: 'baiduboxapp://v1/open',
          cmdParams: {},
        },
      },
    })).toBe(true);
    expect(hasRecognizableCmdStructure({
      解析结果: {
        result: '',
      },
    })).toBe(false);
    expect(() => assertRecognizableCmdInput({
      解析结果: {
        result: '',
      },
    }, 'expected')).toThrow('expected 未识别到 CMD 结构');
  });
});

describe('extractCmdStructurePair', () => {
  it('读取单文件或 stdin 对比包中的 actual 和 expected', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    expect(extractCmdStructurePair({ actual, expected })).toEqual({ actual, expected });
  });

  it('读取对比包中的工具版本和字段上下文', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    expect(extractCmdStructurePair({
      tool: {
        name: 'JSONUtils',
        version: '1.8.20',
        versionLabel: 'v1.8.20',
      },
      path: '$.action_cmd',
      sourceLabel: 'actionCmd',
      actual,
      expected,
    })).toEqual({
      actual,
      expected,
      context: {
        toolVersionLabel: 'v1.8.20',
        path: '$.action_cmd',
        sourceLabel: 'actionCmd',
      },
    });
  });

  it('对比包缺字段时给出明确错误', () => {
    expect(() => extractCmdStructurePair({ actual: createCmdStructure() })).toThrow('必须是包含 actual 和 expected 的 JSON 对象');
  });

  it('对比包字段兼容原始复制文本字符串', () => {
    const actual = createCmdStructure();
    const expectedText = `cmdHandler 输出:
\`\`\`json
${JSON.stringify(createCmdStructure())}
\`\`\``;
    const pair = normalizeComparisonInputs({ actual, expected: expectedText });
    const diff = diffCmdStructures(pair.actual, pair.expected);

    expect(diff.hasDifferences).toBe(false);
  });

  it('从整段 actual response 推荐最匹配的 CMD 候选', () => {
    const actual = {
      data: {
        action_cmd: 'baiduboxapp://v1/action?from=feed',
        panel_cmd: 'baiduboxapp://v1/panel?tab=reward',
      },
    };
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          tab: 'reward',
        },
      },
    };

    const candidates = rankCmdStructureCandidates(
      collectActualCmdStructureCandidates(actual),
      expected
    );
    const report = formatCmdStructureCandidateRecommendations(candidates);

    expect(candidates[0]).toMatchObject({
      id: '$.data.panel_cmd',
      isExactMatch: true,
      score: 0,
    });
    expect(candidates[1].id).toBe('$.data.action_cmd');
    expect(report).toContain('#1 $.data.panel_cmd');
    expect(report).toContain('结构一致');
    expect(report).toContain("建议下一步: 重新运行时添加 --actual-path '$.data.panel_cmd'");
  });

  it('支持按 actual 候选路径直接选择对比结构', () => {
    const actual = {
      data: {
        action_cmd: 'baiduboxapp://v1/action?from=feed',
        panel_cmd: 'baiduboxapp://v1/panel?tab=reward',
      },
    };
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          tab: 'reward',
        },
      },
    };

    const prepared = prepareComparisonInputs({ actual, expected }, {
      actualPath: '$.data.panel_cmd',
    });
    const diff = diffCmdStructures(prepared.inputs.actual, prepared.inputs.expected);

    expect(diff.hasDifferences).toBe(false);
    expect(prepared.inputs.context).toEqual({
      path: '$.data.panel_cmd',
      sourceLabel: 'panel_cmd',
    });
  });

  it('actual 候选路径不存在时列出可用路径', () => {
    const actual = {
      data: {
        panel_cmd: 'baiduboxapp://v1/panel?tab=reward',
      },
    };
    const expected = {
      result: {
        cmdSchema: 'baiduboxapp://v1/panel',
        cmdParams: {
          tab: 'reward',
        },
      },
    };

    expect(() => prepareComparisonInputs({ actual, expected }, {
      actualPath: '$.data.missing_cmd',
    })).toThrow('可用路径: $.data.panel_cmd');
  });
});

describe('diffCmdStructures', () => {
  it('结构一致时没有差异', () => {
    const diff = diffCmdStructures(createCmdStructure(), createCmdStructure());

    expect(diff.hasDifferences).toBe(false);
    expect(formatCmdStructureDiff(diff)).toContain('结构一致');
  });

  it('识别 cmdSchema、缺失路径和值差异', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    actual.result.cmdSchema = 'baiduboxapp://v7/vendor/ad/other';
    delete actual.result.cmdParams.params.appUrl.cmdParams.params.url.cmdParams.sku;
    actual.result.cmdParams.params.appUrl.cmdParams.params.category = 'open';
    expected.result.cmdParams.params.appUrl.cmdParams.params.channel = 'feed';

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
    expect(diff.valueDiffs).toEqual([
      {
        path: '$.params.appUrl.cmdParams.params.category',
        actual: 'open',
        expected: 'jump',
      },
    ]);
    expect(report).toContain('cmdSchema 不一致');
    expect(report).toContain('缺失路径 2 个');
    expect(report).toContain('值不一致 1 个');
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

  it('差异报告可附带对比包来源上下文', () => {
    const report = formatCmdStructureDiff(
      diffCmdStructures(createCmdStructure(), createCmdStructure()),
      {
        toolVersionLabel: 'v1.8.20',
        path: '$.action_cmd',
        sourceLabel: 'actionCmd',
      }
    );

    expect(report).toContain('工具版本: v1.8.20');
    expect(report).toContain('对比路径: $.action_cmd');
    expect(report).toContain('业务字段: actionCmd');
    expect(report).toContain('结构一致');
  });

  it('识别 actual 中多出的路径', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    actual.result.cmdParams.params.appUrl.cmdParams.params.extra = {
      trace: 'debug',
    };

    const diff = diffCmdStructures(actual, expected);

    expect(diff.extraPaths).toEqual([
      '$.params.appUrl.cmdParams.params.extra',
      '$.params.appUrl.cmdParams.params.extra.trace',
    ]);
  });

  it('支持忽略 actual 中多出的路径', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    actual.result.cmdParams.params.appUrl.cmdParams.params.extra = {
      trace: 'debug',
    };

    const diff = diffCmdStructures(actual, expected, { ignoreExtraPaths: true });

    expect(diff.hasDifferences).toBe(false);
    expect(diff.extraPaths).toEqual([]);
    expect(diff.ignoredExtraPaths).toEqual([
      '$.params.appUrl.cmdParams.params.extra',
      '$.params.appUrl.cmdParams.params.extra.trace',
    ]);
    expect(formatCmdStructureDiff(diff)).toContain('已忽略 actual 额外路径 2 个');
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

  it('忽略 actual 额外路径的报告会标记子集模式', () => {
    const actual = createCmdStructure();
    const expected = createCmdStructure();

    actual.result.cmdParams.params.appUrl.cmdParams.params.extra = {
      trace: 'debug',
    };

    const strictDiff = diffCmdStructures(actual, expected);
    const subsetDiff = diffCmdStructures(actual, expected, { ignoreExtraPaths: true });
    const report = formatCmdStructureDiff(subsetDiff, {
      modeLabel: '忽略 actual 额外路径',
    });

    expect(strictDiff.hasDifferences).toBe(true);
    expect(subsetDiff.hasDifferences).toBe(false);
    expect(report).toContain('对比模式: 忽略 actual 额外路径');
    expect(report).toContain('结构一致');
  });
});

describe('parseCliArgs', () => {
  it('支持通过 CLI 开启忽略 actual 额外路径模式', () => {
    expect(parseCliArgs(['--ignore-extra', 'actual.json', 'expected.json'])).toEqual({
      options: {
        fromStdin: false,
        ignoreExtraPaths: true,
        suggestActual: false,
        actualPath: '',
        help: false,
      },
      paths: ['actual.json', 'expected.json'],
    });
  });

  it('支持 stdin 和忽略额外路径组合使用', () => {
    expect(parseCliArgs(['--stdin', '--ignore-extra'])).toEqual({
      options: {
        fromStdin: true,
        ignoreExtraPaths: true,
        suggestActual: false,
        actualPath: '',
        help: false,
      },
      paths: [],
    });
  });

  it('支持 CLI actual 候选推荐和路径选择参数', () => {
    expect(parseCliArgs([
      '--suggest-actual',
      '--actual-path',
      '$.data.panel_cmd',
      'actual.json',
      'expected.json',
    ])).toEqual({
      options: {
        fromStdin: false,
        ignoreExtraPaths: false,
        suggestActual: true,
        actualPath: '$.data.panel_cmd',
        help: false,
      },
      paths: ['actual.json', 'expected.json'],
    });
  });

  it('actual-path 缺少值时给出明确错误', () => {
    expect(() => parseCliArgs(['--actual-path'])).toThrow('--actual-path 需要指定候选路径');
  });

  it('支持 help 参数', () => {
    expect(parseCliArgs(['--help'])).toEqual({
      options: {
        fromStdin: false,
        ignoreExtraPaths: false,
        suggestActual: false,
        actualPath: '',
        help: true,
      },
      paths: [],
    });
  });
});

describe('cmd:diff CLI', () => {
  const runCli = (args, input) => spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
    input,
  });

  it('help 输出用法并返回 0', () => {
    const result = runCli(['--help']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('用法: npm run cmd:diff');
    expect(result.stdout).toContain('退出码: 0 结构一致，1 存在差异，2 参数或输入错误');
  });

  it('结构一致返回 0，存在差异返回 1', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'cmd-diff-'));
    try {
      const actualPath = path.join(tmpDir, 'actual.json');
      const expectedPath = path.join(tmpDir, 'expected.json');
      writeFileSync(actualPath, JSON.stringify({
        result: {
          cmdSchema: 'baiduboxapp://v1/panel',
          cmdParams: {
            tab: 'reward',
          },
        },
      }));
      writeFileSync(expectedPath, JSON.stringify({
        result: {
          cmdSchema: 'baiduboxapp://v1/panel',
          cmdParams: {
            tab: 'reward',
          },
        },
      }));

      expect(runCli([actualPath, expectedPath]).status).toBe(0);

      writeFileSync(actualPath, JSON.stringify({
        result: {
          cmdSchema: 'baiduboxapp://v1/action',
          cmdParams: {
            from: 'feed',
          },
        },
      }));
      const diffResult = runCli([actualPath, expectedPath]);

      expect(diffResult.status).toBe(1);
      expect(diffResult.stdout).toContain('cmdSchema 不一致');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('非法输入或空 stdin 返回 2', () => {
    const invalidJsonResult = runCli(['--stdin'], '{"actual":');
    const invalidPairResult = runCli(['--stdin'], '{"actual":{}}');
    const emptyResult = runCli(['--stdin'], '');

    expect(invalidJsonResult.status).toBe(2);
    expect(invalidJsonResult.stderr).toContain('stdin 不是有效 JSON');
    expect(invalidPairResult.status).toBe(2);
    expect(invalidPairResult.stderr).toContain('必须是包含 actual 和 expected 的 JSON 对象');
    expect(emptyResult.status).toBe(2);
    expect(emptyResult.stderr).toContain('用法: npm run cmd:diff');
  });

  it('suggest-actual 先输出候选推荐再输出差异报告', () => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'cmd-diff-'));
    try {
      const actualPath = path.join(tmpDir, 'actual.json');
      const expectedPath = path.join(tmpDir, 'expected.json');
      writeFileSync(actualPath, JSON.stringify({
        data: {
          action_cmd: 'baiduboxapp://v1/action?from=feed',
          panel_cmd: 'baiduboxapp://v1/panel?tab=reward',
        },
      }));
      writeFileSync(expectedPath, JSON.stringify({
        result: {
          cmdSchema: 'baiduboxapp://v1/panel',
          cmdParams: {
            tab: 'reward',
          },
        },
      }));

      const result = runCli([actualPath, expectedPath, '--suggest-actual']);

      expect(result.status).toBe(1);
      expect(result.stdout.indexOf('CMD actual 候选推荐')).toBeLessThan(result.stdout.indexOf('CMD 结构差异报告'));
      expect(result.stdout).toContain("建议下一步: 重新运行时添加 --actual-path '$.data.panel_cmd'");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
