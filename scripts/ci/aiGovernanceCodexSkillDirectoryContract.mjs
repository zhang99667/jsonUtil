import fs from 'node:fs';
import path from 'node:path';
import { extractFencedCodeBlocks } from './aiGovernanceCodexSkillCommandBlocks.mjs';

const CHANGE_DIRECTORY_PATTERN = /^\s*cd\s+([A-Za-z0-9._/-]+)\s*$/gm;

const extractFencedChangeDirectories = content => [
  ...new Set(extractFencedCodeBlocks(content)
    .flatMap(block => [...block.matchAll(CHANGE_DIRECTORY_PATTERN)].map(match => match[1]))),
];

const isExistingDirectory = (rootDir, directory) => {
  const directoryPath = path.join(rootDir, directory);
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
};

export const collectSkillDirectoryContractFailures = (rootDir, file, content) => (
  extractFencedChangeDirectories(content)
    .filter(directory => !isExistingDirectory(rootDir, directory))
    .map(directory => `${file}: 工作目录不存在 \`${directory}\``)
);
