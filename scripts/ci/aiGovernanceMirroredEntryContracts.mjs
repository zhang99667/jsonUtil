import fs from 'node:fs';
import path from 'node:path';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';

const MIRRORED_AGENT_SECTION_CONTRACTS = [
  {
    sourceFile: 'AGENTS.md',
    targetFile: 'CLAUDE.md',
    sourceSectionTitle: '## AI 协作与子 Agent 委派',
    targetSectionTitle: '## AI 协作与子 Agent 委派',
  },
];

const TOOL_ENTRY_SHARED_SNIPPETS = [
  '- 用户可见、准备上线或会触发前端构建的改动需要递增 `frontend/package.json`，同步 `frontend/package-lock.json`，更新 `CHANGELOG.md` 顶部版本区块，并运行 `node scripts/ci/check-version-consistency.mjs`。',
  '- 跨模块排查、复杂重构或多条验证链路并行时先做子 Agent 委派判断；委派任务说明读写范围、排除项、期望输出和未覆盖风险，子 Agent 输出使用 `任务：`、`结论：`、`证据：`、`修改文件：`、`验证：`、`未覆盖：`、`下一步建议：`固定模板，主线程负责拆分边界、整合证据和最终验证；不可委派时收窄 `rg`、测试和日志输出。',
  '- AI 修复和外部模型能力必须坚持本地规则优先、用户手动触发、敏感内容不外泄，并通过测试、脚本或可复核日志形成可验证闭环。',
  '- 遇到重复踩坑、用户纠偏、验证缺口或可复用实践时，先做复盘沉淀，写清触发条件、反例、验证方式和适用边界，留下决策记录、回写追踪和锁定测试，再完成规则/skill 回写与治理校验。',
];

const MIRRORED_SNIPPET_CONTRACTS = [
  {
    files: ['.cursorrules', '.comate/rules/code-style.md'],
    snippets: TOOL_ENTRY_SHARED_SNIPPETS,
  },
];

const readGovernanceFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

const normalizeMirroredText = value => value
  .split('\n')
  .map(line => line.trimEnd())
  .join('\n')
  .trim();

const collectMirroredSectionFailures = (rootDir, contracts) => contracts.flatMap((contract) => {
  const sourceContent = readGovernanceFile(rootDir, contract.sourceFile);
  const targetContent = readGovernanceFile(rootDir, contract.targetFile);
  if (sourceContent === null || targetContent === null) return [];

  const sourceSection = getMarkdownSectionContent(sourceContent, contract.sourceSectionTitle);
  const targetSection = getMarkdownSectionContent(targetContent, contract.targetSectionTitle);
  if (sourceSection === null || targetSection === null) return [];

  return normalizeMirroredText(sourceSection) === normalizeMirroredText(targetSection)
    ? []
    : [`${contract.targetFile}: ${contract.targetSectionTitle} 与 ${contract.sourceFile} 的 ${contract.sourceSectionTitle} 不一致`];
});

const collectMirroredSnippetFailures = (rootDir, contracts) => contracts.flatMap(contract => (
  contract.files.flatMap((file) => {
    const content = readGovernanceFile(rootDir, file);
    if (content === null) return [];

    return contract.snippets
      .filter(snippet => !content.includes(snippet))
      .map(snippet => `${file}: 缺少同源入口片段 "${snippet}"`);
  })
));

export const collectMirroredEntryContractFailures = (rootDir) => [
  ...collectMirroredSectionFailures(rootDir, MIRRORED_AGENT_SECTION_CONTRACTS),
  ...collectMirroredSnippetFailures(rootDir, MIRRORED_SNIPPET_CONTRACTS),
];
