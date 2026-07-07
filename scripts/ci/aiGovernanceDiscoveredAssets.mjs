import fs from 'node:fs';
import path from 'node:path';

const AI_GOVERNANCE_DISCOVERY_ROOT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
];

const AI_GOVERNANCE_DISCOVERY_DIRS = [
  '.claude',
  '.codex',
  '.comate',
];

export const AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES = [
  '.claude/.gitignore',
  '.claude/settings.local.json',
];

const normalizeAssetPath = file => file.split(path.sep).join('/');

const collectFilesRecursively = (dirPath, baseDir, files = []) => {
  if (!fs.existsSync(dirPath)) return files;

  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFilesRecursively(entryPath, baseDir, files);
      return;
    }
    if (entry.isFile()) files.push(normalizeAssetPath(path.relative(baseDir, entryPath)));
  });

  return files;
};

export const discoverAiGovernanceAssetFiles = (rootDir) => {
  const rootFiles = AI_GOVERNANCE_DISCOVERY_ROOT_FILES
    .filter(file => fs.existsSync(path.join(rootDir, file)));
  const directoryFiles = AI_GOVERNANCE_DISCOVERY_DIRS
    .flatMap(dir => collectFilesRecursively(path.join(rootDir, dir), rootDir));
  const exemptFiles = new Set(AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES);

  return [...rootFiles, ...directoryFiles]
    .filter(file => !exemptFiles.has(file))
    .sort();
};

export const collectUngovernedAiGovernanceAssets = (rootDir, governedFiles) => {
  const governedFileSet = new Set(governedFiles);
  return discoverAiGovernanceAssetFiles(rootDir)
    .filter(file => !governedFileSet.has(file))
    .map(file => `${file}: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免`);
};
