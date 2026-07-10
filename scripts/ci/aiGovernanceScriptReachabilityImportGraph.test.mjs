import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const testOnlyContractFailure = 'scripts/ci/aiGovernanceLooseContract.mjs: AI 治理生产脚本只被测试 import 图覆盖，必须接入 check-ai-governance 生产 import 图或改名为测试支撑文件';

test('AI 治理脚本可达性接受生产链路传递引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'import "./aiGovernanceReport.mjs";');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceReport.mjs', 'export { loose } from "./aiGovernanceLooseHelper.mjs";');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), []);
  });
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
