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

const MIRRORED_SNIPPET_CONTRACTS = [
  {
    files: AI_ENTRY_SHARED_SNIPPET_FILES,
    snippets: AI_ENTRY_SHARED_SNIPPETS,
  },
];

export const MIRRORED_AGENT_SECTION_FILES = [
  ...new Set(MIRRORED_AGENT_SECTION_CONTRACTS.flatMap(({ sourceFile, targetFile }) => [sourceFile, targetFile])),
];
export const MIRRORED_TOOL_ENTRY_SNIPPET_FILES = [
  ...new Set(MIRRORED_SNIPPET_CONTRACTS.flatMap(({ files }) => files)),
];

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
