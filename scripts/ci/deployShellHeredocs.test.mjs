import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectScriptHeredocs } from './deployShellHeredocs.mjs';

test('部署 Shell heredoc 提取会收集 REMOTE_SCRIPT 内容', () => {
  const heredocs = collectScriptHeredocs([
    'ssh host <<\'REMOTE_SCRIPT\'',
    'set -Eeuo pipefail',
    'echo ok',
    'REMOTE_SCRIPT',
  ].join('\n'));

  assert.deepEqual(heredocs, [
    {
      marker: 'REMOTE_SCRIPT',
      startLine: 2,
      endLine: 4,
      content: 'set -Eeuo pipefail\necho ok\n',
    },
  ]);
});

test('部署 Shell heredoc 提取会忽略非脚本说明文本', () => {
  const heredocs = collectScriptHeredocs([
    'cat <<SUGGESTIONS',
    'docker system prune',
    'SUGGESTIONS',
  ].join('\n'));

  assert.deepEqual(heredocs, []);
});

test('部署 Shell heredoc 提取支持带 tab 缩进的结束标记', () => {
  const heredocs = collectScriptHeredocs([
    'bash -s <<-REMOTE_SCRIPT',
    'echo ok',
    '\tREMOTE_SCRIPT',
  ].join('\n'));

  assert.equal(heredocs[0].endLine, 3);
  assert.equal(heredocs[0].content, 'echo ok\n');
});
