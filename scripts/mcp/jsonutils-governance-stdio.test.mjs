import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const readServerConfig = () => {
  const config = JSON.parse(fs.readFileSync(path.join(rootDir, '.mcp.json'), 'utf8'));
  const server = config.mcpServers?.['jsonutils-governance'] ?? config.servers?.['jsonutils-governance'];
  assert.ok(server, '.mcp.json must declare jsonutils-governance');
  return server;
};

const frame = (message) => {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
};

const createFrameReader = (stream, getStderr) => {
  let buffer = Buffer.alloc(0);
  const messages = [];
  const waiters = [];
  let failure;

  const fail = (error) => {
    failure = error;
    while (waiters.length) waiters.shift().reject(error);
  };
  const emit = message => (waiters.length ? waiters.shift().resolve(message) : messages.push(message));

  stream.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (!failure) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;
      const header = buffer.subarray(0, headerEnd).toString('utf8').trim();
      const length = Number(/^Content-Length:\s*(\d+)$/i.exec(header)?.[1]);
      if (!Number.isFinite(length)) return fail(new Error(`Invalid MCP stdout header: ${header}`));
      const bodyStart = headerEnd + 4;
      if (buffer.length < bodyStart + length) return;
      const body = buffer.subarray(bodyStart, bodyStart + length).toString('utf8');
      buffer = buffer.subarray(bodyStart + length);
      emit(JSON.parse(body));
    }
  });
  stream.on('end', () => fail(new Error(`MCP stdout ended early. stderr: ${getStderr()}`)));

  return (timeoutMs = 5000) => {
    if (failure) return Promise.reject(failure);
    if (messages.length) return Promise.resolve(messages.shift());
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for MCP response. stderr: ${getStderr()}`)), timeoutMs);
      waiters.push({
        resolve: message => {
          clearTimeout(timeout);
          resolve(message);
        },
        reject,
      });
    });
  };
};

const request = async (child, readFrame, id, method, params, timeoutMs = 5000) => {
  child.stdin.write(frame({
    jsonrpc: '2.0',
    id,
    method,
    ...(params ? { params } : {}),
  }));
  return readFrame(timeoutMs);
};

test('MCP config starts governance server over stdio and serves context', async (t) => {
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

  const readFrame = createFrameReader(child.stdout, () => stderr);
  const initialized = await request(child, readFrame, 1, 'initialize');
  assert.equal(initialized.result.serverInfo.name, 'jsonutils-governance');

  const tools = await request(child, readFrame, 2, 'tools/list');
  assert.deepEqual(tools.result.tools.map(tool => tool.name), [
    'ai_governance_report',
    'maintainability_budget_report',
    'ai_governance_context',
  ]);

  const registry = await request(child, readFrame, 3, 'resources/read', {
    uri: 'jsonutils://ai-governance/asset-registry',
  });
  assert.match(registry.result.contents[0].text, /# AI 协作资产注册表/);

  const contextResult = await request(child, readFrame, 4, 'tools/call', {
    name: 'ai_governance_context',
    arguments: { top: 1 },
  }, 30000);
  const context = JSON.parse(contextResult.result.content[0].text);
  assert.equal(context.reportType, 'jsonutils-governance-context');
  assert.equal(context.ok, true);
  assert.ok(context.project.latestDecision?.decision);
  assert.ok(context.nextCommands.includes('node scripts/ci/check-ai-governance.mjs'));
});
