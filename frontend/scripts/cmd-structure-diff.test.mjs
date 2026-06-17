import { describe, expect, it } from 'vitest';
import {
  assertRecognizableCmdInput,
  diffCmdStructures,
  extractCmdStructurePair,
  formatCmdStructureDiff,
  hasRecognizableCmdStructure,
  normalizeCmdStructure,
  normalizeComparisonInputs,
  parseCliArgs,
  parseCmdHandlerTreeText,
  parseJsonInput,
} from './cmd-structure-diff.mjs';

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
      },
      paths: ['actual.json', 'expected.json'],
    });
  });

  it('支持 stdin 和忽略额外路径组合使用', () => {
    expect(parseCliArgs(['--stdin', '--ignore-extra'])).toEqual({
      options: {
        fromStdin: true,
        ignoreExtraPaths: true,
      },
      paths: [],
    });
  });
});
