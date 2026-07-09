import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 MCP 配置契约会报告 URL、args 和 header 中的敏感明文', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/mcp/local.js', 'console.log("ok");');
    writeFixtureFile(rootDir, '.mcp.json', JSON.stringify({
      mcpServers: {
        unsafe: {
          command: 'node',
          url: 'https://example.com/mcp?token=plain&safe=1',
          args: ['scripts/mcp/local.js', '--api-key=plain'],
          headers: ['Authorization: Bearer plain'],
        },
      },
    }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.mcp.json: 敏感字段 "mcpServers.unsafe.url.token" 不能写入明文值，请改用环境变量引用',
      '.mcp.json: 敏感字段 "mcpServers.unsafe.args.1.api-key" 不能写入明文值，请改用环境变量引用',
      '.mcp.json: 敏感字段 "mcpServers.unsafe.headers.0.Authorization" 不能写入明文值，请改用环境变量引用',
    ]);
  });
});

test('AI 治理 MCP 配置契约接受字符串中的环境变量敏感值', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'scripts/mcp/local.js', 'console.log("ok");');
    writeFixtureFile(rootDir, '.cursor/mcp.json', JSON.stringify({
      mcpServers: {
        safe: {
          command: 'node',
          url: 'https://example.com/mcp?token=${MCP_TOKEN}',
          args: ['scripts/mcp/local.js', '--api-key=$MCP_API_KEY'],
          headers: ['Authorization: Bearer ${MCP_AUTH_TOKEN}'],
          env: { GITHUB_TOKEN: '$GITHUB_TOKEN' },
        },
      },
    }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), []);
  });
});
