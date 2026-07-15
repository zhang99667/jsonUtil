import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectAiGovernanceCiContractFailures } from './aiGovernanceCiContract.mjs';
import {
  addGovernanceJobControl,
  addWriterStepControl,
  outcomeWriters,
  prepareCiFixture,
  validLocalCi,
  validWorkflow,
} from './aiGovernanceCiContractTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 CI 契约接受正常 required command job 和 step', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareCiFixture(rootDir);
    assert.deepEqual(collectAiGovernanceCiContractFailures(rootDir), []);
    prepareCiFixture(rootDir, validWorkflow.replace('        if: always()\n', ''));
    assert.match(collectAiGovernanceCiContractFailures(rootDir).join('\n'), /artifact writer 必须使用 if: always/);
  });
});

test('AI 治理 CI 契约拒绝 required command 的静态 false if', () => {
  for (const scope of [addWriterStepControl, addGovernanceJobControl]) {
    for (const condition of ['if: false', 'if: ${{ false }}']) {
      withAiGovernanceTempRoot((rootDir) => {
        prepareCiFixture(rootDir, scope(validWorkflow, condition));
        assert.match(collectAiGovernanceCiContractFailures(rootDir).join('\n'), /静态 false if/);
      });
    }
  }
});

test('AI 治理 CI 契约拒绝 artifact writer 的 continue-on-error 旁路', () => {
  for (const control of ['continue-on-error: true', 'continue-on-error: ${{ always() }}']) {
    for (const scope of [addWriterStepControl, addGovernanceJobControl]) {
      withAiGovernanceTempRoot((rootDir) => {
        prepareCiFixture(rootDir, scope(validWorkflow, control));
        assert.match(collectAiGovernanceCiContractFailures(rootDir).join('\n'), /continue-on-error: true|不得忽略自身失败/);
      });
    }
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
