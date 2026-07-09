import fs from 'node:fs';
import path from 'node:path';

const evidenceFile = (file, snippets) => ({ file, snippets });
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const disabledTestPattern = snippet => new RegExp(
  String.raw`\b(?:it|test)\s*\.\s*(?:skip|todo)\s*\(\s*['"\`]${escapeRegExp(snippet)}['"\`]`
);

export const AI_SAFETY_EVIDENCE_FILES = [
  evidenceFile('frontend/src/utils/aiRepairRequestPolicy.test.ts', [
    '命中敏感字段时返回统一拒绝信息',
    '断言函数会阻止敏感原文进入外部模型',
    '识别多层 URL 编码后的敏感字段',
    '识别嵌入 Base64 片段中的敏感字段',
  ]),
  evidenceFile('frontend/src/services/aiService.test.ts', [
    '本地可修复时不会调用 AI 接口',
    '本地可修复敏感字段时不发送 AI 请求',
    '本地不可修复的大输入会阻止发送原文',
    '命中敏感字段时默认阻止发送原文',
    '本地不可修复时可识别内部 Base64 片段中的敏感字段并阻止发送',
  ]),
  evidenceFile('frontend/src/services/aiRepairProviderClient.test.ts', [
    'provider 错误日志和最终错误会隐藏敏感详情',
    '未知 provider 长错误会脱敏并截断摘要',
    'Gemini SDK 鉴权状态错误会归一为 ProviderAuth',
  ]),
];

export const collectAiGovernanceAiSafetyEvidenceFailures = (rootDir) => (
  AI_SAFETY_EVIDENCE_FILES.flatMap(({ file, snippets }) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [`${file}: AI 安全证据测试文件不存在`];

    const content = fs.readFileSync(filePath, 'utf8');
    return snippets.flatMap((snippet) => [
      ...(!content.includes(snippet) ? [`${file}: AI 安全证据缺少 "${snippet}"`] : []),
      ...(disabledTestPattern(snippet).test(content) ? [`${file}: AI 安全证据测试被跳过 "${snippet}"`] : []),
    ]);
  })
);
