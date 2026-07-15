import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const python = ['/opt/homebrew/bin/python3', '/usr/local/bin/python3', '/usr/bin/python3']
  .find(candidate => spawnSync(candidate, ['-c',
    'import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)'], { stdio: 'ignore' }).status === 0);

test('项目 Codex MCP 配置审计器通过合成协议与隐私负例', () => {
  assert.ok(python, 'Codex MCP 配置审计器测试需要固定 Python >= 3.11 runtime');
  const result = spawnSync(python, [
    '-B', '-m', 'unittest', 'discover',
    '-s', 'plugins/codex-mcp-config-auditor/scripts', '-p', 'test_*.py',
  ], { encoding: 'utf8', stdio: 'pipe' });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`.trim());
});
