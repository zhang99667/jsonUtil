import {
  collectMandatoryContextReferences,
  collectUnquotedMandatoryProjectPaths,
} from './aiGovernanceCodexSkillContextPaths.mjs';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

export const MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES = 90 * 1024;
export const MIN_CODEX_SKILL_CONTEXT_HEADROOM_BYTES = 16 * 1024;
export const MAX_CODEX_SKILL_EFFECTIVE_CONTEXT_BYTES =
  MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES - MIN_CODEX_SKILL_CONTEXT_HEADROOM_BYTES;

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
  let mandatorySection;
  let unquotedReferences;
  let metrics;
  try {
    mandatorySection = getMarkdownSectionContent(content, '## 必读文件') ?? '';
    unquotedReferences = collectUnquotedMandatoryProjectPaths(rootDir, mandatorySection);
    metrics = buildSkillMandatoryContextMetrics(rootDir, file, content);
  } catch (error) {
    return [`${file}: ${error instanceof Error ? error.message : '必读上下文路径检查失败'}`];
  }
  return [
    ...unquotedReferences.map(reference => `${file}: 必读项目路径必须用反引号包裹 \`${reference}\`，否则上下文预算会漏算`),
    ...(metrics.totalBytes <= MAX_CODEX_SKILL_EFFECTIVE_CONTEXT_BYTES
      ? []
      : [`${file}: 必读上下文 ${metrics.totalBytes} bytes 超过 ${MAX_CODEX_SKILL_EFFECTIVE_CONTEXT_BYTES} bytes 有效预算，${MAX_CODEX_SKILL_MANDATORY_CONTEXT_BYTES} bytes 总预算必须保留 ${MIN_CODEX_SKILL_CONTEXT_HEADROOM_BYTES} bytes 演进余量`]),
  ];
};
