import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 MCP 配置契约会报告非法 JSON', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.mcp.json', '{broken');

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.mcp.json: MCP 配置必须是合法 JSON',
    ]);
  });
});

test('AI 治理 MCP 配置契约会报告缺少 server map', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.cursor/mcp.json', JSON.stringify({ inputs: [] }));
    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.cursor/mcp.json: MCP 配置必须包含 mcpServers 或 servers 对象',
    ]);
  });
});

test('AI 治理 MCP 配置契约会报告 server 字段类型错误', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.vscode/mcp.json', JSON.stringify({
      servers: { local: { command: 1, url: 2, args: ['ok', 2], env: [] } },
    }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.vscode/mcp.json: servers.local.command 必须是字符串',
      '.vscode/mcp.json: servers.local.url 必须是字符串',
      '.vscode/mcp.json: servers.local.args 必须是字符串数组',
      '.vscode/mcp.json: servers.local.env 必须是对象',
    ]);
  });
});

test('AI 治理 MCP 配置契约会报告缺少启动入口', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.mcp.json', JSON.stringify({
      mcpServers: { empty: { env: { SAFE: 'ok' } } },
    }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.mcp.json: mcpServers.empty 必须声明 command 或 url',
    ]);
  });
});

test('AI 治理 MCP 配置契约接受有效项目级 MCP 配置', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/mcp/local.js', 'console.log("ok");');
    writeFixtureFile(rootDir, '.cursor/mcp.json', JSON.stringify({
      mcpServers: { local: { command: 'node', args: ['scripts/mcp/local.js'], env: { API_KEY: '$API_KEY' } } },
    }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), []);
  });
});
