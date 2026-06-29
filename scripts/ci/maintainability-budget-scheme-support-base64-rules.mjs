import { schemeSupportBase64SuffixMaintainabilityBudgets } from './maintainability-budget-scheme-support-base64-suffix-rules.mjs';

export const schemeSupportBase64MaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/schemeBase64.ts',
    maxLines: 100,
    reason: 'Base64 公开 API 应只组合 codec、真实广告 extraParam 片段解析和 JWT 入口',
  },
  {
    file: 'frontend/src/utils/schemeBase64Codec.ts',
    maxLines: 90,
    reason: 'Base64 UTF-8 编解码、规范化和可读性判断应保持纯 codec 模块',
  },
  {
    file: 'frontend/src/utils/schemeBase64PrefixedJson.ts',
    maxLines: 60,
    reason: '真实广告 extraParam 的内部头 Base64 JSON 扫描入口应只保留 offset 编排',
  },
  {
    file: 'frontend/src/utils/schemeBase64JsonFragments.ts',
    maxLines: 50,
    reason: '内部头 Base64 解码文本补全 JSON 候选应保持纯函数模块',
  },
  ...schemeSupportBase64SuffixMaintainabilityBudgets,
  {
    file: 'frontend/src/utils/schemeBase64Types.ts',
    maxLines: 40,
    reason: 'Base64 解码类型应保持稳定、集中导出',
  },
];
