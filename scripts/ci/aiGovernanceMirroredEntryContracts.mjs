import fs from 'node:fs';
import path from 'node:path';
import { getMarkdownSectionContent } from './aiGovernanceSectionReferences.mjs';
import { collectMirroredToolEntryContractFailures } from './aiGovernanceMirroredToolEntryContracts.mjs';

export { MIRRORED_TOOL_ENTRY_SNIPPET_FILES } from './aiGovernanceMirroredToolEntryContracts.mjs';

const MIRRORED_AGENT_SECTION_CONTRACTS = [
  {
    sourceFile: 'AGENTS.md',
    targetFile: 'CLAUDE.md',
    sourceSectionTitle: '## AI 协作与子 Agent 委派',
    targetSectionTitle: '## AI 协作与子 Agent 委派',
  },
];

export const MIRRORED_AGENT_SECTION_FILES = [
  ...new Set(MIRRORED_AGENT_SECTION_CONTRACTS.flatMap(({ sourceFile, targetFile }) => [sourceFile, targetFile])),
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

export const collectMirroredEntryContractFailures = (rootDir) => [
  ...collectMirroredSectionFailures(rootDir, MIRRORED_AGENT_SECTION_CONTRACTS),
  ...collectMirroredToolEntryContractFailures(rootDir),
];
