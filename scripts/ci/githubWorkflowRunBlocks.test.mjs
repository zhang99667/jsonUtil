import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectGithubWorkflowRunBlocks,
  normalizeGithubWorkflowShell,
} from './githubWorkflowRunBlocks.mjs';

test('GitHub workflow run 提取会跳过 defaults.run 配置块', () => {
  const blocks = collectGithubWorkflowRunBlocks([
    'defaults:',
    '  run:',
    '    working-directory: frontend',
    'steps:',
    '  - name: Test',
    '    run: npm test',
  ].join('\n'));

  assert.deepEqual(blocks, [
    { startLine: 6, content: 'npm test\n' },
  ]);
});

test('GitHub workflow run 提取支持步骤列表内的单行 run', () => {
  const blocks = collectGithubWorkflowRunBlocks([
    'steps:',
    '  - run: npm test',
    '  - name: Build',
    '    run: npm run build',
  ].join('\n'));

  assert.deepEqual(blocks, [
    { startLine: 2, content: 'npm test\n' },
    { startLine: 4, content: 'npm run build\n' },
  ]);
});

test('GitHub workflow run 提取会解析多行脚本块并反缩进', () => {
  const blocks = collectGithubWorkflowRunBlocks([
    'steps:',
    '  - name: Deploy',
    '    run: |',
    '      set -euo pipefail',
    '      echo ok',
    '    env:',
    '      NODE_ENV: production',
  ].join('\n'));

  assert.deepEqual(blocks, [
    { startLine: 4, content: 'set -euo pipefail\necho ok\n' },
  ]);
});

test('GitHub workflow shell 归一化会替换 Actions 表达式', () => {
  assert.equal(
    normalizeGithubWorkflowShell('ssh -p "${{ inputs.port }}" "${{ inputs.user }}@host"\n'),
    'ssh -p "__GITHUB_EXPR__" "__GITHUB_EXPR__@host"\n'
  );
});
