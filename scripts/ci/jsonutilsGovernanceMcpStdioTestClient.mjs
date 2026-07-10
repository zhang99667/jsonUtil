import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFrameReader } from './mcpContentLengthStdioClient.mjs';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const readServerConfig = () => {
  const config = JSON.parse(fs.readFileSync(path.join(rootDir, '.mcp.json'), 'utf8'));
  const server = config.mcpServers?.['jsonutils-governance'] ?? config.servers?.['jsonutils-governance'];
  assert.ok(server, '.mcp.json must declare jsonutils-governance');
  return server;
};

export const startGovernanceMcpServer = (t) => {
  const server = readServerConfig();
  const child = spawn(server.command, server.args ?? [], {
    cwd: rootDir,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', chunk => {
    stderr += chunk.toString('utf8');
  });
  t.after(() => child.kill());
  return { child, readFrame: createFrameReader(child.stdout, () => stderr) };
};
