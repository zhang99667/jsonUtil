import { describe, expect, it } from 'vitest';
import {
  diffCmdStructures,
  extractCmdStructurePair,
  formatCmdStructureDiff,
  normalizeCmdStructure,
  parseCliArgs,
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
