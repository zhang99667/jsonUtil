import {
  collectMandatoryContextReferences,
  collectUnquotedMandatoryProjectPaths,
} from './aiGovernanceCodexSkillContextPaths.mjs';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

export const MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES = 90 * 1024;

export const buildSkillMandatoryContextMetrics = (rootDir, file, content) => {
  const mandatorySection = getMarkdownSectionContent(content, '## 必读文件') ?? '';
  const references = collectMandatoryContextReferences(rootDir, mandatorySection);
  const referencedBytes = references.reduce((total, reference) => total + reference.bytes, 0);

  return {
    file,
    referencedFiles: references.map(reference => reference.reference),
    referencedBytes,
    skillBytes: Buffer.byteLength(content),
    totalBytes: Buffer.byteLength(content) + referencedBytes,
  };
};

export const collectSkillMandatoryContextBudgetFailures = (rootDir, file, content) => {
  const mandatorySection = getMarkdownSectionContent(content, '## 必读文件') ?? '';
  const unquotedReferences = collectUnquotedMandatoryProjectPaths(rootDir, mandatorySection);
  const metrics = buildSkillMandatoryContextMetrics(rootDir, file, content);
  return [
    ...unquotedReferences.map(reference => `${file}: 必读项目路径必须用反引号包裹 \`${reference}\`，否则上下文预算会漏算`),
    ...(metrics.totalBytes <= MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES
      ? []
      : [`${file}: 必读上下文 ${metrics.totalBytes} bytes 超过 ${MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES} bytes 预算，请把历史账本或大文档改为按任务读取`]),
  ];
};
