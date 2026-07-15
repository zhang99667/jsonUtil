import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAiGovernanceReport } from './aiGovernanceReport.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const orphanHelperFailure = 'scripts/ci/aiGovernanceLooseHelper.mjs: AI 治理脚本未被生产入口或 scripts/ci/*.test.mjs import 图覆盖';

test('AI 治理完整报告会包含脚本可达性失败', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/ci/check-ai-governance.mjs', 'console.log("ok");');
    writeFixtureFile(rootDir, 'scripts/ci/aiGovernanceLooseHelper.mjs', 'export const loose = true;');
    writeFixtureFile(rootDir, 'frontend/package.json', '{"scripts":{"lint":"eslint \\"{src,config}/**/*.{ts,tsx}\\" --quiet"}}');
    assert.equal(buildAiGovernanceReport(rootDir).contractFailures.includes(orphanHelperFailure), true);
  });
});
