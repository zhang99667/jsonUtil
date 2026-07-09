import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 MCP 配置契约会报告重复 server map', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.mcp.json', JSON.stringify({ mcpServers: { a: {} }, servers: { b: {} } }));

    assert.deepEqual(collectMcpConfigContractFailures(rootDir), [
      '.mcp.json: MCP 配置只能包含 mcpServers 或 servers 其中一个 server map，避免工具读取边界歧义',
    ]);
  });
});
