import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectGithubWorkflowCommands,
  collectOutcomeWriterAutomationWriteFailures,
  collectRequiredWorkflowCommandReachabilityFailures,
  collectWorkflowFullHistoryCheckoutFailures,
} from './aiGovernanceAutomationCommandContract.mjs';
import {
  collectOutcomeWriterAutomationWriteFailures as collectLegacyOutcomeWriterFailures,
  collectRequiredWorkflowCommandReachabilityFailures as collectLegacyReachabilityFailures,
} from './aiGovernanceScheduledWorkflowContract.mjs';

const VERSION_COMMAND = 'node scripts/ci/check-version-consistency.mjs';
const ARTIFACT_COMMAND = 'node scripts/ci/write-ai-governance-artifacts.mjs';
const WORKFLOW_FILE = '.github/workflows/fixture.yml';
const OUTCOME_WRITERS = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
];

test('scheduled workflow 模块保持通用自动化安全 API 的同引用重导出', () => {
  assert.equal(collectLegacyOutcomeWriterFailures, collectOutcomeWriterAutomationWriteFailures);
  assert.equal(collectLegacyReachabilityFailures, collectRequiredWorkflowCommandReachabilityFailures);
});

test('workflow command parser 保持源码顺序', () => {
  const workflow = [
    'jobs:',
    '  beta:',
    '    steps:',
    '      - run: |',
    '          node command-b',
    '          node command-c',
    '  alpha:',
    '    steps:',
    '      - run: node command-a',
  ].join('\n');
  assert.deepEqual(collectGithubWorkflowCommands(workflow), [
    'node command-b',
    'node command-c',
    'node command-a',
  ]);
});

test('workflow 完整 Git 历史保留 fallback 并绑定 required command job', () => {
  const fallback = 'jobs:\n  governance:\n    steps:\n      - uses: actions/checkout@v6\n        with:\n          fetch-depth: 0';
  const requiredJob = [
    'jobs:\n  decoy:\n    steps:',
    '      - uses: actions/checkout@v6',
    '        with:\n          fetch-depth: 0',
    '  governance:\n    steps:',
    '      - uses: actions/checkout@v6',
    `      - run: ${VERSION_COMMAND}`,
  ].join('\n');
  const collectFailures = workflow => collectWorkflowFullHistoryCheckoutFailures(workflow, [VERSION_COMMAND], WORKFLOW_FILE);
  const failure = [`${WORKFLOW_FILE}: checkout 必须保留完整 Git 历史`];
  for (const invalid of [
    fallback.replace('fetch-depth: 0', 'fetch-depth: 1'),
    fallback.replace('        with:\n          fetch-depth: 0', '      - run: echo noop\n        env:\n          fetch-depth: 0'),
    requiredJob,
  ]) assert.deepEqual(collectFailures(invalid), failure);
  assert.deepEqual(collectFailures(fallback), []);
  assert.deepEqual(collectFailures(requiredJob.replace(
    '  governance:\n    steps:\n      - uses: actions/checkout@v6',
    '  governance:\n    steps:\n      - uses: actions/checkout@v6\n        with:\n          fetch-depth: 0',
  )), []);
});

test('required command 安全失败保持 job、step、command 与规则全序', () => {
  const workflow = [
    'jobs:',
    '  governance:',
    '    if: false',
    '    continue-on-error: true',
    '    steps:',
    `      - run: ${VERSION_COMMAND}`,
    `      - run: ${ARTIFACT_COMMAND}`,
  ].join('\n');

  assert.deepEqual(
    collectRequiredWorkflowCommandReachabilityFailures(
      workflow,
      [VERSION_COMMAND, ARTIFACT_COMMAND],
      WORKFLOW_FILE,
    ),
    [
      `${WORKFLOW_FILE}: 必需治理命令 "${VERSION_COMMAND}" 所在 job/step 禁止 静态 false if`,
      `${WORKFLOW_FILE}: 必需治理命令 "${VERSION_COMMAND}" 所在 job/step 禁止 continue-on-error: true`,
      `${WORKFLOW_FILE}: 必需治理命令 "${ARTIFACT_COMMAND}" 所在 job/step 禁止 静态 false if`,
      `${WORKFLOW_FILE}: 必需治理命令 "${ARTIFACT_COMMAND}" 所在 job/step 禁止 continue-on-error: true`,
      `${WORKFLOW_FILE}: artifact writer 必须使用 if: always() 且不得忽略自身失败`,
    ],
  );
  for (const falseControl of [
    ['    steps:', '      - if: always()', '        continue-on-error: false'],
    ['    continue-on-error: false', '    steps:', '      - if: always()'],
  ]) {
    assert.deepEqual(collectRequiredWorkflowCommandReachabilityFailures([
      'jobs:',
      '  governance:',
      ...falseControl,
      `        run: ${ARTIFACT_COMMAND}`,
    ].join('\n'), [ARTIFACT_COMMAND], WORKFLOW_FILE), []);
  }
});

test('outcome writer 只拒绝 writer command block 内的独立 --write 参数', () => {
  for (const writer of OUTCOME_WRITERS) {
    for (const argument of ['--write', '--wri""te', '--wri\\te']) assert.deepEqual(
      collectOutcomeWriterAutomationWriteFailures([`node ${writer} ${argument}`], WORKFLOW_FILE),
      [`${WORKFLOW_FILE}: CI/workflow/local-ci 禁止 outcome writer --write`]);
    assert.deepEqual(
      collectOutcomeWriterAutomationWriteFailures([`node ${writer} --writeback`], WORKFLOW_FILE),
      [],
    );
  }
  assert.deepEqual(
    collectOutcomeWriterAutomationWriteFailures(['node scripts/ci/other-command.mjs --write'], WORKFLOW_FILE),
    [],
  );
});
