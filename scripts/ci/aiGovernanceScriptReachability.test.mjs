import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const orphanHelperFailure = 'scripts/ci/aiGovernanceLooseHelper.mjs: AI 治理脚本未被 check-ai-governance 或 scripts/ci/*.test.mjs import 图覆盖';

test('AI 治理脚本可达性会报告孤儿 helper', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', '// import "./aiGovernanceLooseHelper.mjs";\nconsole.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), [orphanHelperFailure]);
  });
});
