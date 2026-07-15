import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import './aiGovernanceProjectPluginCommand.test.mjs';
import './aiGovernanceProjectPluginLifecycle.test.mjs';
import { collectProjectPluginFailures } from './aiGovernanceProjectPlugins.mjs';
const projectRoot = path.resolve(import.meta.dirname, '../..');
const makeWritable = (target) => {
  const stat = fs.lstatSync(target);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(target, 0o700);
    fs.readdirSync(target).forEach(name => makeWritable(path.join(target, name)));
  } else if (!stat.isSymbolicLink()) fs.chmodSync(target, 0o600);
};
const withCopy = (run) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-project-plugins-'));
  try {
    fs.cpSync(path.join(projectRoot, '.agents'), path.join(root, '.agents'), { recursive: true });
    fs.cpSync(path.join(projectRoot, 'plugins'), path.join(root, 'plugins'), { recursive: true });
    for (const file of ['.codex/README.md', '.claude/ai-tools-guide.md']) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.copyFileSync(path.join(projectRoot, file), path.join(root, file));
    }
    makeWritable(root); return run(root);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
const rewriteJson = (root, file, mutate) => {
  const absolute = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  mutate(value); fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
};
test('三个 JSONUtils 插件的权威源均为项目资产', () => assert.deepEqual(collectProjectPluginFailures(projectRoot), []));
test('两个 MCP 项目插件的 manifest 与 AI 入口版本保持一致', () => withCopy((root) => {
  const file = path.join(root, '.codex/README.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('plugins/jsonutils-governance-mcp@0.2.1', 'plugins/jsonutils-governance-mcp@0.2.0'));
  assert.match(collectProjectPluginFailures(root).join('\n'), /jsonutils-governance-mcp 入口版本必须精确匹配 manifest 0\.2\.1/);
}));
test('项目 marketplace 拒绝 personal 名称、越界 source 和缺失插件', () => withCopy((root) => {
  rewriteJson(root, '.agents/plugins/marketplace.json', value => { value.name = 'personal'; value.plugins[0].source.path = '../outside'; });
  fs.rmSync(path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json'));
  assert.equal(collectProjectPluginFailures(root).length >= 2, true);
}));
test('项目插件拒绝个人身份、绝对路径和可替换 MCP 启动面', () => withCopy((root) => {
  rewriteJson(root, 'plugins/codex-mcp-config-auditor/.codex-plugin/plugin.json', value => { value.author.name = 'Local developer'; });
  rewriteJson(root, 'plugins/jsonutils-governance-mcp/.mcp.json', value => { value['jsonutils-governance'].args = ['/Users/example/server.mjs']; });
  assert.equal(collectProjectPluginFailures(root).length >= 2, true);
}));
test('项目插件 MCP companion 拒绝 project-level mcpServers 包装', () => withCopy((root) => {
  rewriteJson(root, 'plugins/jsonutils-governance-mcp/.mcp.json', value => { value.mcpServers = { ...value }; delete value['jsonutils-governance']; });
  assert.match(collectProjectPluginFailures(root).join('\n'), /direct server map/);
}));
