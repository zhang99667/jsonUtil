import fs from 'node:fs';
import path from 'node:path';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';
import {
  AI_ENTRY_SHARED_SNIPPET_FILES,
  AI_ENTRY_SHARED_SNIPPETS,
} from './aiGovernanceSharedEntrySnippets.mjs';

const MIRRORED_AGENT_SECTION_CONTRACTS = [
  {
    sourceFile: 'AGENTS.md',
    targetFile: 'CLAUDE.md',
    sourceSectionTitle: '## AI 协作与子 Agent 委派',
    targetSectionTitle: '## AI 协作与子 Agent 委派',
  },
];

const THIN_ENTRY_HISTORY_HEADINGS = ['## 更新记录', '## 变更记录', '## Changelog', '## CHANGELOG'];

export const MIRRORED_AGENT_SECTION_FILES = [
  ...new Set(MIRRORED_AGENT_SECTION_CONTRACTS.flatMap(({ sourceFile, targetFile }) => [sourceFile, targetFile])),
];
export const MIRRORED_TOOL_ENTRY_SNIPPET_FILES = AI_ENTRY_SHARED_SNIPPET_FILES;

const readGovernanceFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

const normalizeMirroredText = value => value.split('\n').map(line => line.trimEnd()).join('\n').trim();

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

const collectMirroredSnippetFailures = rootDir => MIRRORED_TOOL_ENTRY_SNIPPET_FILES.flatMap((file) => {
  const content = readGovernanceFile(rootDir, file);
  if (content === null) return [];

  return AI_ENTRY_SHARED_SNIPPETS
    .filter(snippet => !content.includes(snippet))
    .map(snippet => `${file}: 缺少同源入口片段 "${snippet}"`);
});

const collectThinEntryHistoryFailures = rootDir => MIRRORED_TOOL_ENTRY_SNIPPET_FILES.flatMap((file) => {
  const content = readGovernanceFile(rootDir, file);
  return content === null ? [] : THIN_ENTRY_HISTORY_HEADINGS
    .filter(heading => content.includes(heading))
    .map(heading => `${file}: 工具薄入口不应维护独立更新记录 "${heading}"，请使用 docs/AI-GOVERNANCE-DECISIONS.md 和 CHANGELOG.md`);
});

export const collectMirroredEntryContractFailures = (rootDir) => [
  ...collectMirroredSectionFailures(rootDir, MIRRORED_AGENT_SECTION_CONTRACTS),
  ...collectMirroredSnippetFailures(rootDir),
  ...collectThinEntryHistoryFailures(rootDir),
];
