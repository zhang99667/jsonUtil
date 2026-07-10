import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildJsonutilsValidationPlan } from './jsonutils-governance-validation-plan.mjs';

test('validation plan maps dirty AI and deploy files to bounded commands', async () => {
	  const plan = await buildJsonutilsValidationPlan({
	    maxFiles: 2,
    runStatus: async () => ({
      exitCode: 0,
      stdout: [
        '## main...origin/main [behind 3]',
        ' M scripts/mcp/jsonutils-governance-tools.mjs',
        ' M scripts/ci/aiGovernanceRequiredCheckFiles.mjs',
        ' M frontend/nginx.conf',
        ' M CHANGELOG.md',
        '?? scratch.txt',
      ].join('\n'),
      stderr: '',
    }),
  });

	  assert.equal(plan.reportType, 'jsonutils-validation-plan');
	  assert.equal(plan.changedFileCount, 5);
	  assert.equal(plan.coverage.sampledFileCount, 2);
	  assert.equal(plan.coverage.commandMatchScope, 'all');
	  assert.equal(plan.coverage.unclassifiedFilesScope, 'all');
  const commands = plan.commands.map(item => item.command);
  assert.ok(commands.includes('node scripts/ci/check-ai-governance.mjs'));
  assert.ok(commands.includes('node scripts/ci/check-deploy-shell-syntax.mjs'));
  assert.deepEqual(plan.matchedRules.map(rule => rule.name), [
    'ai-governance-assets',
    'mcp-runtime',
    'ci-governance-tests',
    'release-notes',
    'deploy-routing',
  ]);
	  assert.deepEqual(plan.unclassifiedFiles, ['scratch.txt']);
});

test('validation plan returns errors without inventing commands', async () => {
  const plan = await buildJsonutilsValidationPlan({
    runStatus: async () => ({ exitCode: 1, stdout: '', stderr: 'not a git repository' }),
  });

  assert.equal(plan.ok, false);
  assert.deepEqual(plan.commands, []);
  assert.match(plan.error, /not a git repository/);
});
