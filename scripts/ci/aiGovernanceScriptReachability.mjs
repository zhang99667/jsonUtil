import fs from 'node:fs';
import path from 'node:path';
import { collectReachableFiles, listCiFiles } from './aiGovernanceLocalImportGraph.mjs';

const SCRIPT_DIR = 'scripts/ci';
const AI_GOVERNANCE_SCRIPT_PATTERN = /^aiGovernance.*\.mjs$/;
const AI_GOVERNANCE_TEST_PATTERN = /^aiGovernance.*\.test\.mjs$/;
const AI_GOVERNANCE_TEST_SUPPORT_PATTERN = /(?:TestFixtures|MissingCases)\.mjs$/;
const AI_GOVERNANCE_PRODUCTION_ROOTS = [
  'scripts/ci/check-ai-governance.mjs',
  'scripts/ci/run-ai-evolution-cases.mjs',
  'scripts/ci/run-ai-codex-fixed-mcp-trial.mjs',
  'scripts/ci/check-ai-external-controller-preflight.mjs',
  'scripts/ci/manage-project-plugins.mjs',
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
  'scripts/ci/check-ai-validation-whitespace.mjs',
  'scripts/ci/run-ai-validation-execution.mjs',
];

export const collectAiGovernanceScriptReachabilityFailures = (rootDir) => {
  const ciDir = path.join(rootDir, SCRIPT_DIR);
  if (!fs.existsSync(ciDir)) return [];
  const scripts = listCiFiles(rootDir, SCRIPT_DIR, file => AI_GOVERNANCE_SCRIPT_PATTERN.test(file) && !AI_GOVERNANCE_TEST_PATTERN.test(file));
  const testRoots = listCiFiles(rootDir, SCRIPT_DIR, file => AI_GOVERNANCE_TEST_PATTERN.test(file));
  const productionReachable = collectReachableFiles(rootDir, AI_GOVERNANCE_PRODUCTION_ROOTS);
  const allReachable = collectReachableFiles(rootDir, [...AI_GOVERNANCE_PRODUCTION_ROOTS, ...testRoots]);
  return scripts.flatMap((file) => {
    if (!allReachable.has(file)) {
      return [`${file}: AI 治理脚本未被生产入口或 scripts/ci/*.test.mjs import 图覆盖`];
    }
    if (!productionReachable.has(file) && !AI_GOVERNANCE_TEST_SUPPORT_PATTERN.test(path.basename(file))) {
      return [`${file}: AI 治理生产脚本只被测试 import 图覆盖，必须接入治理生产入口或改名为测试支撑文件`];
    }
    return [];
  });
};
