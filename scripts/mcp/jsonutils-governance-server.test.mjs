import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  callJsonutilsGovernanceTool,
  createMcpFrameParser,
  handleJsonutilsGovernanceRequest,
  listJsonutilsGovernanceResources,
  listJsonutilsGovernanceTools,
} from './jsonutils-governance-server.mjs';

const withTempRoot = (run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-mcp-'));
  try {
    return run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

const writeFile = (rootDir, file, content) => {
  const filePath = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

test('MCP server lists governance resources and tools', () => {
  assert.equal(
    listJsonutilsGovernanceResources().resources.some(resource => resource.uri === 'jsonutils://ai-governance/asset-registry'),
    true
  );
  assert.deepEqual(listJsonutilsGovernanceTools().tools.map(tool => tool.name), [
    'ai_governance_report',
    'maintainability_budget_report',
    'ai_governance_context',
  ]);
});

test('MCP server reads governance resources from the requested root', async () => {
  await withTempRoot(async (rootDir) => {
    writeFile(rootDir, 'docs/AI-ASSET-REGISTRY.md', '# registry');

    const response = await handleJsonutilsGovernanceRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/read',
      params: { uri: 'jsonutils://ai-governance/asset-registry' },
    }, { rootDir });

    assert.equal(response.result.contents[0].text, '# registry');
  });
});

test('MCP server runs only fixed governance report commands', async () => {
  const calls = [];
  const fakeRunScript = async (script, args) => {
    calls.push([script, args]);
    return { exitCode: 0, stdout: '{"ok":true}', stderr: '' };
  };

  const response = await callJsonutilsGovernanceTool(
    'maintainability_budget_report',
    { top: 999 },
    fakeRunScript
  );

  assert.equal(response.content[0].text, '{"ok":true}');
  assert.deepEqual(calls, [[
    'scripts/ci/check-maintainability-budgets.mjs',
    ['--json', '--no-all', '--top', '50'],
  ]]);
});

test('MCP frame parser accepts content-length framed JSON messages', () => {
  const messages = [];
  const parseFrame = createMcpFrameParser(message => messages.push(message));
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' });
  const frame = Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);

  parseFrame(frame.subarray(0, 12));
  parseFrame(frame.subarray(12));

  assert.deepEqual(messages, [{ jsonrpc: '2.0', id: 1, method: 'ping' }]);
});
