import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
const testOnlyContractFailure = 'scripts/ci/aiGovernanceLooseContract.mjs: AI 治理生产脚本只被测试 import 图覆盖，必须接入治理生产入口或改名为测试支撑文件';

test('AI 治理脚本可达性接受所有生产入口的传递引用', () => {
  [
    ['scripts/ci/check-ai-governance.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/run-ai-evolution-cases.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/run-ai-codex-fixed-mcp-trial.mjs', 'import("./aiGovernanceReport.mjs");'],
    ['scripts/ci/check-ai-external-controller-preflight.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/manage-project-plugins.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/record-ai-evolution-paired-outcome.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/check-ai-validation-whitespace.mjs', 'import "./aiGovernanceReport.mjs";'],
    ['scripts/ci/run-ai-validation-execution.mjs', 'import "./aiGovernanceReport.mjs";'],
  ].forEach(([entry, source]) => withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, entry, source);
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceReport.mjs', 'export { loose } from "./aiGovernanceLooseHelper.mjs";');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), []);
  }));
});

test('AI 治理脚本可达性区分生产契约和测试支撑', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseContract.mjs', 'export const loose = true;');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseContract.test.mjs', 'import "./aiGovernanceLooseContract.mjs";');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), [testOnlyContractFailure]);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseTestFixtures.mjs', 'export const loose = true;');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.test.mjs', 'import "./aiGovernanceLooseTestFixtures.mjs";');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), []);
  });
});
