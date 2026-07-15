#!/usr/bin/env node
// 项目插件只允许从当前 JSONUtils 仓库根启动固定治理 MCP。
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = fs.realpathSync(process.cwd());
const required = [
  'AGENTS.md',
  '.mcp.json',
  'scripts/mcp/jsonutils-governance-server.mjs',
  'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json',
];

if (!required.every(file => fs.existsSync(path.join(rootDir, file)))) {
  console.error('jsonutils-governance-mcp 只能从 JSONUtils 项目根启动');
  process.exitCode = 2;
} else {
  const { startJsonutilsGovernanceServer } = await import(
    pathToFileURL(path.join(rootDir, 'scripts/mcp/jsonutils-governance-server.mjs')).href
  );
  startJsonutilsGovernanceServer();
}
