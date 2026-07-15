#!/usr/bin/env node
// 校验 AI 协作入口、Playbook 和 Codex skill 是否保持可发现、可执行。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatAiGovernanceJsonReport,
  hasAiGovernanceFailures,
  printAiGovernanceHumanReport,
} from './aiGovernanceCliOutput.mjs';
import { collectUntrackedAiGovernanceAssetFailures } from './aiGovernanceAssetDistribution.mjs';
import { buildAiGovernanceDistributionAssetFiles } from './aiGovernanceAssetDistributionFiles.mjs';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseReport = buildAiGovernanceReport(rootDir);
const distributionScope = process.argv.includes('--require-head-assets')
  ? 'head'
  : process.argv.includes('--require-tracked') ? 'index' : null;
const distributionAssetFiles = buildAiGovernanceDistributionAssetFiles({
  rootDir,
  requiredFiles: baseReport.requiredFiles,
  referenceRules: baseReport.referenceRules,
});
const distributionFailures = distributionScope
  ? collectUntrackedAiGovernanceAssetFailures(rootDir, distributionAssetFiles, distributionScope)
  : [];
const report = distributionFailures.length > 0
  ? { ...baseReport, contractFailures: [...baseReport.contractFailures, ...distributionFailures] }
  : baseReport;
const outputJson = process.argv.includes('--json');

if (outputJson) process.stdout.write(formatAiGovernanceJsonReport(report));

if (hasAiGovernanceFailures(report)) {
  if (!outputJson) printAiGovernanceHumanReport(report);
  process.exit(1);
}

if (!outputJson) printAiGovernanceHumanReport(report);
