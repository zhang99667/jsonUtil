import { describe, expect, it } from 'vitest';
import {
  buildRegressionTemplate,
  parseIssueSampleExport,
} from './issue-samples-to-regression.mjs';

const createSampleExport = () => ({
  schemaVersion: 1,
  kind: 'json-helper-transform-issue-samples',
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
  it('生成可粘贴的 Vitest TODO 模板并保留关键字段', () => {
    const template = buildRegressionTemplate(createSampleExport());

    expect(template).toContain("import { describe, it } from 'vitest';");
    expect(template).toContain('const issueSamples = [');
    expect(template).toContain('"path": "$.tracking"');
    expect(template).toContain('"sourceLabel": "trackingParam"');
    expect(template).toContain('"originalValue": "raw=%7B%22nid%22%3A123%7D"');
    expect(template).toContain('"warningType": "string_decode_skipped"');
    expect(template).toContain('it.todo(`${sample.type} ${sample.path} · ${sample.reasonLabel}`);');
  });

  it('空样本时给出明确错误', () => {
    expect(() => buildRegressionTemplate({
      kind: 'json-helper-transform-issue-samples',
      samples: [],
    })).toThrow('样本 JSON 中没有可转换的 samples');
  });
});
