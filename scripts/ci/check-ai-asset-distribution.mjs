#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectUntrackedAiGovernanceAssetFailures } from './aiGovernanceAssetDistribution.mjs';
import { buildAiGovernanceDistributionAssetFiles } from './aiGovernanceAssetDistributionFiles.mjs';
import { discoverCodexSkillFiles } from './aiGovernanceChecks.mjs';
import { buildAiGovernanceReferenceRules, buildAiGovernanceRequiredFiles } from './aiGovernanceRules.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const usage = [
  'Usage: node scripts/ci/check-ai-asset-distribution.mjs [--workspace|--index|--head]',
  '',
  '  --workspace  检查当前普通文件是否为未忽略的 Git 提交候选',
  '  --index      检查当前原始字节与 mode 是否已进入 Git index（默认）',
  '  --head       检查当前原始字节与 mode 是否存在于真实 HEAD，可被 clone',
  '  --help       显示帮助',
].join('\n');
const helpRequested = args.length === 1 && args[0] === '--help';
const scope = args.length === 0 ? 'index'
  : args.length === 1 && ['--workspace', '--index', '--head'].includes(args[0])
    ? args[0].slice(2) : null;

if (helpRequested) process.stdout.write(`${usage}\n`);
else if (!scope) {
  process.stderr.write(`${usage}\nError: ASSET_DISTRIBUTION_ARGUMENTS_INVALID\n`);
  process.exitCode = 2;
} else {
  const skillFiles = discoverCodexSkillFiles(rootDir);
  const requiredFiles = buildAiGovernanceRequiredFiles(skillFiles);
  const referenceRules = buildAiGovernanceReferenceRules(skillFiles);
  const assetFiles = buildAiGovernanceDistributionAssetFiles({ rootDir, requiredFiles, referenceRules });
  const failures = collectUntrackedAiGovernanceAssetFailures(rootDir, assetFiles, scope);
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    reportType: 'ai-asset-distribution',
    scope,
    ok: failures.length === 0,
    counts: { assets: new Set(assetFiles).size, failures: failures.length },
    failures,
  }, null, 2)}\n`);
  if (failures.length > 0) process.exitCode = 1;
}
