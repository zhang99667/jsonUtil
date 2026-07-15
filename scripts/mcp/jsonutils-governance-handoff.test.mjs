import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildJsonutilsHandoffBrief } from './jsonutils-governance-handoff.mjs';

const statusBytes = (...records) => Buffer.from(`${records.join('\0')}\0`);

const fakeRunScript = async (script) => {
  const stdout = script.includes('check-ai-governance')
    ? JSON.stringify({
      ok: true,
      counts: { requiredFiles: 1, referenceRules: 1 },
      failures: { missingFiles: [], skillContractFailures: [], contractFailures: [], missingReferences: [] },
    })
    : JSON.stringify({
      ok: true,
      items: {
        highUsage: [{ file: 'frontend/src/App.tsx', remainingLines: 2, usageRatio: 0.98 }],
        scorecardCandidates: [{ file: 'frontend/src/App.tsx', remainingLines: 2, usageRatio: 0.98 },
          { file: 'scripts/ci/aiGovernanceTruth.mjs', remainingLines: 10, usageRatio: 0.9 }],
      },
    });
  return { exitCode: 0, stdout, stderr: '' };
};

test('handoff brief combines governance focus and worktree risks', async () => {
  const brief = await buildJsonutilsHandoffBrief({
    top: 1,
    maxFiles: 1,
    runScript: fakeRunScript,
    runStatus: async () => ({
      exitCode: 0,
      stdout: statusBytes('## main...origin/main [behind 3]', ' M CHANGELOG.md', '?? scratch.md'),
    }),
  });

  assert.equal(brief.reportType, 'jsonutils-handoff-brief');
  assert.equal(brief.ok, true);
  assert.equal(brief.governance.status, 'warn');
  assert.equal(brief.governance.aiInfraStatus.aiInfraCleared, false);
  assert.equal(brief.governance.aiInfraStatus.aiCandidateCount, 1);
  assert.match(brief.governance.aiInfraStatus.nextAction, /aiGovernanceTruth\.mjs/);
  assert.equal(brief.worktree.branch.behind, 3);
  assert.equal(brief.worktree.changedFileCount, 2);
  assert.equal(brief.worktree.files.length, 1);
  assert.equal('allFiles' in brief.worktree, false);
  assert.equal(brief.validationPlan.reportType, 'jsonutils-validation-plan');
  assert.ok(brief.validationPlan.commands.some(item => item.command === 'node scripts/ci/check-version-consistency.mjs'));
  assert.deepEqual(brief.risks, [
    '工作区有 2 个变更文件，提交前必须确认范围',
    '当前分支落后 3 个提交，推送前需要处理远端差异',
  ]);
  assert.ok(brief.nextCommands.includes('node scripts/ci/check-ai-governance.mjs'));
});
