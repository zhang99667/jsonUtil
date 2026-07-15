import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AI_GOVERNANCE_ATTESTATION_ACTIONS,
  AI_GOVERNANCE_EXPECTED_ATTESTATION_POLICY,
  AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY,
  AI_GOVERNANCE_SCHEDULED_WORKFLOW,
  collectAiGovernanceScheduledWorkflowFailures,
} from './aiGovernanceScheduledWorkflowContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const validWorkflow = [
  'on:',
  '  schedule:',
  "    - cron: '17 3 * * 1'",
  '  workflow_dispatch:',
  'permissions: {}',
  'jobs:',
  '  ai-governance:',
  '    permissions:',
  '      contents: read',
  '    outputs:',
  '      attestation-subject-digest: ${{ steps.upload-attestation-subject.outputs.artifact-digest }}',
  '    steps:',
  `      - uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.checkout}`,
  '        with:',
  '          fetch-depth: 0',
  `      - uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.setupNode}`,
  '      - run: node scripts/ci/check-version-consistency.mjs',
  '      - run: node --test scripts/ci/*.test.mjs',
  '      - run: node --test scripts/mcp/*.test.mjs',
  '      - run: node scripts/ci/check-ai-evolution-evals.mjs',
  '      - run: node scripts/ci/check-ai-asset-distribution.mjs --head',
  '      - if: always()',
  '        run: node scripts/ci/write-ai-governance-artifacts.mjs',
  `      - uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.upload}`,
  '        with:',
  '          path: artifacts/ai-governance',
  '      - id: upload-attestation-subject',
  `        uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.upload}`,
  '        with:',
  '          path: artifacts/ai-governance/ai-governance-attestation-subject.json',
  '          archive: false',
  '          if-no-files-found: error',
  '  attest-ai-governance-evidence:',
  '    needs: ai-governance',
  "    if: ${{ github.repository == 'zhang99667/jsonUtil' && github.ref == 'refs/heads/main' && vars.AI_GOVERNANCE_ATTESTATION_ENABLED == 'true' }}",
  '    environment: ai-governance-attestation',
  '    runs-on: ubuntu-latest',
  '    permissions:',
  '      contents: read',
  '      id-token: write',
  '      attestations: write',
  '    steps:',
  '      - id: attest',
  `        uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.attest}`,
  '        with:',
  '          subject-name: ai-governance-attestation-subject.json',
  '          subject-digest: sha256:${{ needs.ai-governance.outputs.attestation-subject-digest }}',
  `      - uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.upload}`,
  '        with:',
  '          path: ${{ steps.attest.outputs.bundle-path }}',
  '          archive: false',
  '          if-no-files-found: error',
].join('\n');

const prepareWorkflowFixture = (rootDir, workflow = validWorkflow, ci = 'name: CI') => {
  writeFixtureFile(rootDir, AI_GOVERNANCE_SCHEDULED_WORKFLOW, workflow);
  writeFixtureFile(rootDir, '.github/workflows/ci.yml', ci);
  writeFixtureFile(
    rootDir,
    AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY,
    `${JSON.stringify(AI_GOVERNANCE_EXPECTED_ATTESTATION_POLICY, null, 2)}\n`,
  );
};

test('AI governance workflow 接受定时门禁与 component-only attestation 隔离', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir);
    assert.deepEqual(collectAiGovernanceScheduledWorkflowFailures(rootDir), []);
    prepareWorkflowFixture(rootDir, validWorkflow.replace('      - if: always()\n', '      - '));
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /artifact writer 必须使用 if: always/);
  });
});

test('AI governance workflow 拒绝缺失 trigger、命令和严格 artifact', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir, [
      'on:',
      '  workflow_dispatch:',
      'jobs:',
      '  ai-governance:',
      '    steps:',
      '      - run: node scripts/ci/check-version-consistency.mjs',
    ].join('\n'));
    const failures = collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n');
    assert.match(failures, /必须配置 cron schedule/);
    assert.match(failures, /顶层 permissions 必须为空/);
    assert.match(failures, /checkout 必须保留完整 Git 历史/);
    assert.match(failures, /必须上传 AI governance artifacts/);
    assert.match(failures, /signer job/);
  });
});

test('capture job 不能获得 signer 权限或 secret', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir, validWorkflow.replace(
      '    outputs:',
      '      id-token: write\n      attestations: write\n      example: ${{ secrets.MODEL_KEY }}\n    outputs:',
    ));
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /capture job 禁止/);
  });
});

test('attestation subject upload 必须与固定 action 和严格文件同一步绑定', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const unsafe = validWorkflow.replace(
      `      - id: upload-attestation-subject\n        uses: ${AI_GOVERNANCE_ATTESTATION_ACTIONS.upload}`,
      '      - id: upload-attestation-subject\n        uses: actions/upload-artifact@v7',
    );
    prepareWorkflowFixture(rootDir, unsafe);
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /固定 SHA upload action 直接上传/);
  });
});

test('signer job 只允许固定 action 且禁止 checkout、run 与模型凭据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const unsafe = validWorkflow
      .replace(AI_GOVERNANCE_ATTESTATION_ACTIONS.attest, 'actions/attest@v4')
      .replace('    steps:\n      - id: attest', '    steps:\n      - uses: actions/checkout@v7\n      - run: echo unsafe\n        env:\n          CODEX_API_KEY: ${{ secrets.CODEX_API_KEY }}\n      - id: attest');
    prepareWorkflowFixture(rootDir, unsafe);
    const failures = collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n');
    assert.match(failures, /只允许固定 SHA/);
    assert.match(failures, /禁止 checkout、run、模型凭据/);
  });
});

test('仓内 attestation policy 必须明确自身不是生产 trust root', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir);
    writeFixtureFile(rootDir, AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY, JSON.stringify({
      ...AI_GOVERNANCE_EXPECTED_ATTESTATION_POLICY,
      authority: 'trusted-production-policy',
    }));
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /仓外生产 identity policy/);
  });
});

test('仓内 attestation policy 无法解析时 fail closed', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir);
    writeFixtureFile(rootDir, AI_GOVERNANCE_GITHUB_ATTESTATION_POLICY, '{');
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /无法读取/);
  });
});

test('pull_request CI 不能获得 attestation 特权', () => {
  withAiGovernanceTempRoot((rootDir) => {
    prepareWorkflowFixture(rootDir, validWorkflow, 'permissions:\n  id-token: write\n  attestations: write');
    assert.match(collectAiGovernanceScheduledWorkflowFailures(rootDir).join('\n'), /pull_request CI 禁止/);
  });
});
