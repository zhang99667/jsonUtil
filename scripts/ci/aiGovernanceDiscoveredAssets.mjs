import fs from 'node:fs';
import path from 'node:path';
import { collectFilesRecursively } from './aiGovernanceAssetFileCollector.mjs';
import {
  AI_GOVERNANCE_DISCOVERY_PATTERN_DIRS,
  AI_GOVERNANCE_MCP_CONFIG_FILES,
} from './aiGovernanceDiscoveryPatterns.mjs';

const AI_GOVERNANCE_DISCOVERY_ROOT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.cursorrules',
  '.github/copilot-instructions.md',
  ...AI_GOVERNANCE_MCP_CONFIG_FILES,
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

const collectPatternMatchedFiles = rootDir => (
  AI_GOVERNANCE_DISCOVERY_PATTERN_DIRS.flatMap(({ dir, pattern }) => (
    collectFilesRecursively(path.join(rootDir, dir), rootDir).filter(file => pattern.test(file))
  ))
);

export const discoverAiGovernanceAssetFiles = (rootDir) => {
  const rootFiles = AI_GOVERNANCE_DISCOVERY_ROOT_FILES
    .filter(file => fs.existsSync(path.join(rootDir, file)));
  const directoryFiles = AI_GOVERNANCE_DISCOVERY_DIRS
    .flatMap(dir => collectFilesRecursively(path.join(rootDir, dir), rootDir));
  const patternFiles = collectPatternMatchedFiles(rootDir);
  const exemptFiles = new Set(AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES);

  return [...rootFiles, ...directoryFiles, ...patternFiles]
    .filter(file => !exemptFiles.has(file))
    .sort();
};

export const collectUngovernedAiGovernanceAssets = (rootDir, governedFiles) => {
  const governedFileSet = new Set(governedFiles);
  return discoverAiGovernanceAssetFiles(rootDir)
    .filter(file => !governedFileSet.has(file))
    .map(file => `${file}: AI 协作资产未纳入治理清单，请加入必需文件/引用规则或显式豁免`);
};

export const buildGovernedAiGovernanceAssetFiles = (requiredFiles, referenceRules) => (
  [...new Set([...requiredFiles, ...referenceRules.map(rule => rule.file)])]
);
