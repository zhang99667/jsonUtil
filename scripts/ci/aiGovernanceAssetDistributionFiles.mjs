import fs from 'node:fs';
import path from 'node:path';

import { discoverAiGovernanceAssetFiles } from './aiGovernanceDiscoveredAssets.mjs';

export const AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES = Object.freeze([
  '.github/workflows/ci.yml',
  '.github/workflows/ai-governance.yml',
  'scripts/ci/local-ci.sh',
  'scripts/ci/local-ci-lib.sh',
]);

const AI_CI_FILE_PATTERN = /^(?:aiGovernance.*|maintainability-budget-governance-ai-.*|check-ai-.*|run-ai-.*|prepare-ai-.*|review-ai-.*|write-ai-governance.*|writeAiGovernance.*|manage-project-plugins|check-project-plugin-installation|jsonutilsGovernanceMcp.*|mcpLineDelimitedStdioClient.*|mcpContentLengthStdioClient.*)\.mjs$/;
const AI_MCP_FILE_PATTERN = /^jsonutils-governance.*\.mjs$/;

const collectMatchingFiles = (rootDir, directory, pattern) => fs
  .readdirSync(path.join(rootDir, directory), { withFileTypes: true })
  .filter((entry) => {
    if (!pattern.test(entry.name)) return false;
    if (!entry.isFile()) throw new Error(`${directory}/${entry.name}: AI implementation 必须是普通文件`);
    return true;
  })
  .map(entry => `${directory}/${entry.name}`);

const collectStrictDirectoryFiles = (rootDir, directory, files = []) => {
  fs.readdirSync(path.join(rootDir, directory), { withFileTypes: true }).forEach((entry) => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) collectStrictDirectoryFiles(rootDir, relative, files);
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`${relative}: AI data asset 必须是普通文件或目录`);
  });
  return files;
};

export const discoverAiGovernanceImplementationFiles = rootDir => [
  ...collectMatchingFiles(rootDir, 'scripts/ci', AI_CI_FILE_PATTERN),
  ...collectMatchingFiles(rootDir, 'scripts/mcp', AI_MCP_FILE_PATTERN),
  ...collectStrictDirectoryFiles(rootDir, 'evals/ai-governance'),
  ...AI_GOVERNANCE_DISTRIBUTION_CONTROL_FILES,
].sort();

export const buildAiGovernanceDistributionAssetFiles = ({
  rootDir,
  requiredFiles,
  referenceRules,
}) => [...new Set([
  ...requiredFiles,
  ...referenceRules.map(rule => rule.file),
  ...discoverAiGovernanceAssetFiles(rootDir),
  ...discoverAiGovernanceImplementationFiles(rootDir),
])].sort();
