import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectGithubWorkflowJobBlocks,
  collectGithubWorkflowStepBlocks,
} from './githubWorkflowStructureBlocks.mjs';

test('workflow 结构解析保持 job 与 step 的源码顺序', () => {
  const workflow = [
    'jobs:',
    '  beta:',
    '    steps:',
    '      - name: first',
    '        run: node command-b',
    '      - run: node command-c',
    '  alpha:',
    '    steps:',
    '      - run: node command-a',
  ].join('\n');
  const jobs = collectGithubWorkflowJobBlocks(workflow);

  assert.deepEqual([...jobs.keys()], ['beta', 'alpha']);
  assert.deepEqual(
    collectGithubWorkflowStepBlocks(jobs.get('beta')),
    [
      '      - name: first\n        run: node command-b\n',
      '      - run: node command-c\n',
    ],
  );
});

test('workflow 结构解析在缺少 jobs 时返回空集合', () => {
  assert.deepEqual([...collectGithubWorkflowJobBlocks('name: no-jobs')], []);
});
