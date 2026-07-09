import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';
import { collectAiGovernanceScriptReachabilityFailures } from './aiGovernanceScriptReachability.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
const orphanHelperFailure = 'scripts/ci/aiGovernanceLooseHelper.mjs: AI 治理脚本未被 check-ai-governance 或 scripts/ci/*.test.mjs import 图覆盖';
const frontendPackageFixture = '{"scripts":{"lint":"eslint \\"{src,config}/**/*.{ts,tsx}\\" --quiet"}}';

test('AI 治理脚本可达性会报告孤儿 helper', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', '// import "./aiGovernanceLooseHelper.mjs";\nconsole.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), [orphanHelperFailure]);
  });
});

test('AI 治理完整报告会包含脚本可达性失败', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    writeFixtureFile(rootDir, 'frontend/package.json', frontendPackageFixture);
    assert.equal(buildAiGovernanceReport(rootDir).contractFailures.includes(orphanHelperFailure), true);
  });
});

test('AI 治理脚本可达性接受生产链路传递引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'import "./aiGovernanceReport.mjs";');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceReport.mjs', 'export { loose } from "./aiGovernanceLooseHelper.mjs";');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), []);
  });
});

test('AI 治理脚本可达性接受测试链路引用', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.test.mjs', 'import "./aiGovernanceLooseHelper.mjs";');
    assert.deepEqual(collectAiGovernanceScriptReachabilityFailures(rootDir), []);
  });
});
