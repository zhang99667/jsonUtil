import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import {
  REQUIRED_AI_GOVERNANCE_CI_COMMANDS, REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS,
  buildAiGovernanceCiWorkflowFixture,
  buildAiGovernanceLocalCiFixture,
} from './aiGovernanceCiCommandDescriptors.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const headCommand = REQUIRED_AI_GOVERNANCE_CI_COMMANDS
  .find(command => command.includes('check-ai-asset-distribution.mjs --head'));
const validWorkflow = [
  'jobs:',
  '  governance:',
  '    runs-on: ubuntu-latest',
  ...buildAiGovernanceCiWorkflowFixture().split('\n').map(line => `    ${line}`),
].join('\n');
const validLocalCi = buildAiGovernanceLocalCiFixture();
const outcomeWriters = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
];

const prepareCiFixture = (rootDir, workflow = validWorkflow, localCi = validLocalCi) => {
  writeFixtureFile(rootDir, '.github/workflows/ci.yml', workflow);
  writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', localCi);
};

const addHeadStepControl = (workflow, control) => workflow.replace(
  `        run: ${headCommand}`,
  `        ${control}\n        run: ${headCommand}`,
);
const addGovernanceJobControl = (workflow, control) => workflow.replace(
  '  governance:',
  `  governance:\n    ${control}`,
);

test('AI 治理 CI 契约接受正常 required command job 和 step', () => {
  assert.equal(REQUIRED_AI_GOVERNANCE_CI_COMMANDS.includes('node scripts/ci/check-ai-validation-whitespace.mjs'), false);
  assert.equal(REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS.includes('node scripts/ci/check-ai-validation-whitespace.mjs'), true);
  withAiGovernanceTempRoot((rootDir) => {
    prepareCiFixture(rootDir);
    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), []);
  });
});

test('AI 治理 CI 契约拒绝 required command 的静态 false if', () => {
  for (const scope of [addHeadStepControl, addGovernanceJobControl]) {
    for (const condition of ['if: false', 'if: ${{ false }}']) {
      withAiGovernanceTempRoot((rootDir) => {
        prepareCiFixture(rootDir, scope(validWorkflow, condition));
        assert.match(collectAiGovernanceCiContractFailures(rootDir).join('\n'), /静态 false if/);
      });
    }
  }
});

test('AI 治理 CI 契约拒绝 required command 的 continue-on-error true', () => {
  for (const scope of [addHeadStepControl, addGovernanceJobControl]) {
    withAiGovernanceTempRoot((rootDir) => {
      prepareCiFixture(rootDir, scope(validWorkflow, 'continue-on-error: true'));
      assert.match(collectAiGovernanceCiContractFailures(rootDir).join('\n'), /continue-on-error: true/);
    });
  }
});

test('AI 治理 CI 契约拒绝 workflow run 块中的 outcome writer --write', () => {
  for (const writer of outcomeWriters) {
    withAiGovernanceTempRoot((rootDir) => {
      const unsafe = validWorkflow.replace(
        '    steps:',
        [
          '    steps:',
          '      - name: Forbidden outcome write',
          '        run: |',
          `          node ${writer} --write`,
        ].join('\n'),
      );
      prepareCiFixture(rootDir, unsafe);
      assert.match(
        collectAiGovernanceCiContractFailures(rootDir).join('\n'),
        /\.github\/workflows\/ci\.yml: .*outcome writer --write/,
      );
    });
  }
});

test('AI 治理 CI 契约只拒绝可执行 local-ci run_in_root 中的 outcome writer --write', () => {
  for (const writer of outcomeWriters) {
    withAiGovernanceTempRoot((rootDir) => {
      const forbidden = `run_in_root "Governance: forbidden outcome write" node ${writer} --write`;
      prepareCiFixture(rootDir, validWorkflow, `${validLocalCi}\n# ${forbidden}`);
      assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), []);

      prepareCiFixture(rootDir, validWorkflow, `${validLocalCi}\n${forbidden}`);
      assert.match(
        collectAiGovernanceCiContractFailures(rootDir).join('\n'),
        /scripts\/ci\/local-ci\.sh: .*outcome writer --write/,
      );
    });
  }
});
