import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('项目 Codex MCP 配置审计器通过合成协议与隐私负例', () => {
  const result = spawnSync('python3', [
    '-B', '-m', 'unittest', 'discover',
    '-s', 'plugins/codex-mcp-config-auditor/scripts', '-p', 'test_*.py',
  ], { encoding: 'utf8', stdio: 'pipe' });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`.trim());
});
