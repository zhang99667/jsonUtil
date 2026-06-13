import { describe, expect, it } from 'vitest';
import {
  diffCmdStructures,
  extractCmdStructurePair,
  formatCmdStructureDiff,
  normalizeCmdStructure,
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
  });
});
