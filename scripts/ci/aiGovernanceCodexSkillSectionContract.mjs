import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';
import {
  CODEX_SKILL_PROFILE_IDS,
  resolveCodexSkillProfile,
} from './aiGovernanceCodexSkillProfiles.mjs';

const CORE_SECTION_CONTENT_REQUIREMENTS = [
  {
    sectionTitle: '## 必读文件',
    contains: ['AGENTS.md', 'rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md'],
  },
  {
    sectionTitle: '## 工作流',
    contains: ['git status --short --branch', '子 Agent 委派', 'frontend/package.json', 'CHANGELOG.md'],
  },
  {
    sectionTitle: '## 常用验证命令',
    contains: ['node scripts/ci/check-version-consistency.mjs', 'node scripts/ci/check-ai-governance.mjs', 'node scripts/ci/check-maintainability-budgets.mjs', 'npm run build'],
  },
  {
    sectionTitle: '## 重点边界',
    contains: ['node scripts/ci/check-ai-governance.mjs'],
  },
];

const PROFILE_SECTION_CONTENT_REQUIREMENTS = {
  [CODEX_SKILL_PROFILE_IDS.CORE]: [],
  [CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME]: [
    { sectionTitle: '## 按任务读取', contains: ['docs/AI-ASSET-REGISTRY.md', 'ai_asset_inventory'] },
    { sectionTitle: '## 工作流', contains: ['规则/skill 回写', '决策记录', '回写追踪', '锁定测试'] },
    { sectionTitle: '## 重点边界', contains: ['dispatchChunkLoadRecoveryEvent', 'Content-Type', '本地规则优先'] },
  ],
  [CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION]: [
    { sectionTitle: '## 必读文件', contains: ['docs/AI-EVOLUTION-PLAYBOOK.md'] },
    { sectionTitle: '## 按任务读取', contains: ['docs/AI-ASSET-REGISTRY.md', 'ai_asset_inventory'] },
    { sectionTitle: '## 工作流', contains: ['eval case', '真实 outcome', 'schemaVersion 3', 'chain.sequence', 'chain.previousHash', 'supersession.previousOutcomeId', 'feedbackDisposition', 'trial receipt', '即时重放', 'legacy', '回写', '同一任务', '隔离可写工作区', 'execution transcript', '前后状态快照', 'deterministic-case', 'component-only'] },
    { sectionTitle: '## 常用验证命令', contains: ['node scripts/ci/check-ai-evolution-evals.mjs', 'node scripts/ci/run-ai-evolution-cases.mjs', 'node --test scripts/mcp/*.test.mjs'] },
    { sectionTitle: '## 重点边界', contains: ['newline-delimited JSON-RPC', 'unknown/warn', '只读', '敏感'] },
  ],
};

export const collectSkillSectionContentFailures = (file, content) => (
  [
    ...CORE_SECTION_CONTENT_REQUIREMENTS,
    ...PROFILE_SECTION_CONTENT_REQUIREMENTS[resolveCodexSkillProfile(file).id],
  ].flatMap(({ sectionTitle, contains }) => {
    const sectionContent = getMarkdownSectionContent(content, sectionTitle);
    if (sectionContent === null) return [];

    return contains
      .filter(expectedText => !sectionContent.includes(expectedText))
      .map(expectedText => `${file}: ${sectionTitle} 缺少 "${expectedText}"`);
  })
);
