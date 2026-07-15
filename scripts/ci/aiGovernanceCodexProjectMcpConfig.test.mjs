import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  CANONICAL_CODEX_PROJECT_MCP_CONFIG,
  CODEX_PROJECT_MCP_BOOTSTRAP,
  CODEX_PROJECT_MCP_CONFIG_FILE,
  collectCodexProjectMcpConfigFailures,
} from './aiGovernanceCodexProjectMcpConfig.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
import { jsonutilsGovernanceTools } from '../mcp/jsonutils-governance-tool-definitions.mjs';

const writeConfig = rootDir => writeFixtureFile(rootDir, CODEX_PROJECT_MCP_CONFIG_FILE, CANONICAL_CODEX_PROJECT_MCP_CONFIG);
const probeInput = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"project-config-test","version":"1"}}}\n{"jsonrpc":"2.0","method":"notifications/initialized"}\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n';
const runBootstrap = cwd => spawnSync(process.execPath, ['--input-type=module', '--eval', CODEX_PROJECT_MCP_BOOTSTRAP],
  { cwd, encoding: 'utf8', input: probeInput });

test('Codex project config 直接注册固定治理 MCP', () => {
  assert.deepEqual(collectCodexProjectMcpConfigFailures(process.cwd()), []);
  assert.match(CANONICAL_CODEX_PROJECT_MCP_CONFIG, /^#:schema .+\n\n\[mcp_servers\.jsonutils-governance\]/);
  assert.match(CANONICAL_CODEX_PROJECT_MCP_CONFIG, /required = true/);
  assert.doesNotMatch(CANONICAL_CODEX_PROJECT_MCP_CONFIG, /^cwd =/m);
  assert.doesNotMatch(CANONICAL_CODEX_PROJECT_MCP_CONFIG, /^\[plugins\./m);
  assert.equal((CANONICAL_CODEX_PROJECT_MCP_CONFIG.match(/^  "(?:ai_|maintainability_)[^"\n]+",$/gm) ?? []).length,
    jsonutilsGovernanceTools.length);
  for (const relative of ['.', 'docs', 'frontend/src']) {
    const result = runBootstrap(path.join(process.cwd(), relative));
    assert.equal(result.status, 0, result.stderr);
    const responses = result.stdout.trim().split('\n').map(JSON.parse);
    assert.equal(responses[1].result.tools.length, jsonutilsGovernanceTools.length);
  }
});

test('Codex project config 拒绝启动面或工具 allowlist 漂移', () => {
  for (const mutate of [
    text => text.replace('command = "node"', 'command = "bash"'),
    text => text.replace('required = true', 'required = false'),
    text => text.replace('  "ai_validation_plan",', '  "arbitrary_shell",'),
    text => `${text}\n[plugins."jsonutils-governance-mcp@jsonutils-project"]\nenabled = false\n`,
  ]) {
    withAiGovernanceTempRoot((rootDir) => {
      writeFixtureFile(rootDir, CODEX_PROJECT_MCP_CONFIG_FILE, mutate(CANONICAL_CODEX_PROJECT_MCP_CONFIG));
      assert.match(collectCodexProjectMcpConfigFailures(rootDir).join('\n'), /canonical/);
    });
  }
});

test('Codex project config 拒绝缺失、symlink 与超限文件', { skip: process.platform === 'win32' }, () => {
  withAiGovernanceTempRoot(rootDir => assert.match(collectCodexProjectMcpConfigFailures(rootDir).join('\n'), /无法读取/));
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.codex/target.toml', CANONICAL_CODEX_PROJECT_MCP_CONFIG);
    fs.symlinkSync('target.toml', path.join(rootDir, CODEX_PROJECT_MCP_CONFIG_FILE));
    assert.match(collectCodexProjectMcpConfigFailures(rootDir).join('\n'), /symlink/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    writeConfig(rootDir);
    writeFixtureFile(rootDir, CODEX_PROJECT_MCP_CONFIG_FILE, 'x'.repeat(8 * 1024 + 1));
    assert.match(collectCodexProjectMcpConfigFailures(rootDir).join('\n'), /不能超过/);
  });
  withAiGovernanceTempRoot((rootDir) => {
    const result = runBootstrap(rootDir);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /governance MCP root not found/);
  });
});
