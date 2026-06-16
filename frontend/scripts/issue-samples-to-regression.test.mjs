import { describe, expect, it } from 'vitest';
import {
  buildRegressionTemplate,
  findSensitiveSampleHints,
  parseIssueSampleExport,
} from './issue-samples-to-regression.mjs';

const createSampleExport = () => ({
  schemaVersion: 1,
  kind: 'json-helper-transform-issue-samples',
  tool: {
    name: 'JSONUtils',
    version: '1.8.18',
    versionLabel: 'v1.8.18',
  },
  filter: 'trackingParam',
  summary: {
    unresolved: { copied: 1, filtered: 1, total: 1, truncated: false },
    runtimePlaceholders: { copied: 1, filtered: 1, total: 1, truncated: false },
    warnings: { copied: 1, filtered: 1, total: 1, truncated: false },
  },
  samples: [
    {
      type: 'unresolved',
      path: '$.tracking',
      sourceLabel: 'trackingParam',
      reasonLabel: '已解码但未结构化',
      nextAction: '补充解析规则',
      detectedType: 'url-encoded',
      originalValue: 'raw=%7B%22nid%22%3A123%7D',
    },
    {
      type: 'runtime_placeholder',
      path: '$.button.cmd',
      sourcePath: '$.button',
      reasonLabel: '运行时占位符',
      value: '__CONVERT_CMD__',
      originalValue: 'button_cmd=__CONVERT_CMD__',
    },
    {
      type: 'warning',
      path: '$.huge',
      reasonLabel: '单字段长度保护',
      warningType: 'string_decode_skipped',
      length: 2048,
      limit: 1024,
      originalValue: 'cmd=too-long',
    },
  ],
});

describe('parseIssueSampleExport', () => {
  it('解析深度解析问题样本 JSON', () => {
    const sampleExport = createSampleExport();

    expect(parseIssueSampleExport(JSON.stringify(sampleExport))).toEqual(sampleExport);
  });

  it('拒绝非样本 JSON', () => {
    expect(() => parseIssueSampleExport('{"kind":"other","samples":[]}')).toThrow('不是有效的深度解析问题样本 JSON');
  });
});

describe('buildRegressionTemplate', () => {
  it('生成可执行 smoke 的 Vitest 模板并保留关键字段', () => {
    const template = buildRegressionTemplate(createSampleExport());

    expect(template).toContain("import { describe, expect, it } from 'vitest';");
    expect(template).toContain("import { deepParseWithContext } from './transformations';");
    expect(template).toContain('// 工具版本: v1.8.18');
    expect(template).toContain('// 筛选: trackingParam');
    expect(template).toContain('const issueSamples = [');
    expect(template).toContain('"path": "$.tracking"');
    expect(template).toContain('"sourceLabel": "trackingParam"');
    expect(template).toContain('"originalValue": "raw=%7B%22nid%22%3A123%7D"');
    expect(template).toContain('"warningType": "string_decode_skipped"');
    expect(template).toContain("it('样本原始值可被深度解析入口安全处理'");
    expect(template).toContain('expect(issueSamples.length).toBeGreaterThan(0);');
    expect(template).toContain("expect(() => deepParseWithContext(originalValue, { autoExpandScheme: true })).not.toThrow();");
    expect(template).toContain('it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);');
    expect(template).not.toContain('检测到样本可能包含');
  });

  it('提示 URL 编码后的敏感字段需先脱敏', () => {
    const sampleExport = {
      kind: 'json-helper-transform-issue-samples',
      samples: [
        {
          type: 'unresolved',
          path: '$.reward',
          reasonLabel: '已解码但未结构化',
          originalValue: `task_params=${encodeURIComponent(JSON.stringify({
            token: 'real-token',
            sign: 'real-sign',
            task_id: '602',
          }))}`,
        },
      ],
    };

    const template = buildRegressionTemplate(sampleExport);

    expect(findSensitiveSampleHints(sampleExport.samples)).toEqual([
      {
        path: '$.reward',
        keywords: ['token', 'sign'],
      },
    ]);
    expect(template).toContain('检测到样本可能包含 token/sign/cookie/设备标识等敏感字段');
    expect(template).toContain('$.reward(token/sign)');
  });

  it('兼容没有导出元信息的旧样本 JSON', () => {
    const template = buildRegressionTemplate({
      kind: 'json-helper-transform-issue-samples',
      samples: [
        {
          type: 'unresolved',
          path: '$.legacy',
          reasonLabel: '旧样本',
          originalValue: 'legacy',
        },
      ],
    });

    expect(template).toContain('// 由深度解析报告「复制样本 JSON」生成');
    expect(template).not.toContain('// 工具版本:');
    expect(template).not.toContain('// 筛选:');
  });

  it('支持脱敏敏感 originalValue 后生成模板', () => {
    const sampleExport = {
      kind: 'json-helper-transform-issue-samples',
      samples: [
        {
          type: 'unresolved',
          path: '$.reward',
          reasonLabel: '已解码但未结构化',
          originalValue: `task_params=${encodeURIComponent(JSON.stringify({
            token: 'real-token',
            sign: 'real-sign',
            task_id: '602',
          }))}`,
        },
      ],
    };

    const template = buildRegressionTemplate(sampleExport, { redactSensitiveValues: true });

    expect(template).toContain('已按 --redact 脱敏命中的 originalValue');
    expect(template).toContain('"originalValue": "[REDACTED: token/sign]"');
    expect(template).toContain('"redactionHint": "原始值已脱敏，命中: token/sign"');
    expect(template).not.toContain('real-token');
    expect(template).not.toContain('%22token%22');
  });

  it('保留已脱敏样本中的脱敏提示', () => {
    const sampleExport = {
      kind: 'json-helper-transform-issue-samples',
      samples: [
        {
          type: 'unresolved',
          path: '$.reward',
          reasonLabel: '已解码但未结构化',
          originalValue: '[REDACTED: token/sign]',
          redactionHint: '原始值已脱敏，命中: token/sign',
        },
      ],
    };

    const template = buildRegressionTemplate(sampleExport);

    expect(template).toContain('"redactionHint": "原始值已脱敏，命中: token/sign"');
  });

  it('空样本时给出明确错误', () => {
    expect(() => buildRegressionTemplate({
      kind: 'json-helper-transform-issue-samples',
      samples: [],
    })).toThrow('样本 JSON 中没有可转换的 samples');
  });
});
