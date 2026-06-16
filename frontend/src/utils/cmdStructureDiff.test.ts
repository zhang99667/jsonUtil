import { describe, expect, it } from 'vitest';
import {
  diffCmdStructures,
  formatCmdStructureDiff,
  normalizeCmdStructure,
  parseCmdStructureJson,
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

  it('解析带方括号日志前缀的 cmdHandler 输出', () => {
    const parsed = parseCmdStructureJson(`[cmdHandler] output => ${JSON.stringify(createCmdStructure())}`, 'cmdHandler 输出');

    expect(normalizeCmdStructure(parsed)).toEqual(normalizeCmdStructure(createCmdStructure()));
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
