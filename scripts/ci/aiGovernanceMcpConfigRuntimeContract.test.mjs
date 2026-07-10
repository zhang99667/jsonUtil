import { test } from 'node:test';

import { writeLocalMcpScriptFixture } from './aiGovernanceMcpConfigRuntimeFileTestFixtures.mjs';
import { assertMcpRuntimeConfigFailures } from './aiGovernanceMcpConfigRuntimeTestFixtures.mjs';
import { withAiGovernanceTempRoot } from './aiGovernanceTestFixtures.mjs';

test('AI 治理 MCP 配置运行时契约会报告 shell 包装和仓库外路径', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assertMcpRuntimeConfigFailures(rootDir, '.mcp.json', {
      mcpServers: {
        unsafe: { command: 'bash', cwd: '/tmp', args: ['../server.js', '/tmp/server.js'] },
      },
    }, [
      '.mcp.json: mcpServers.unsafe.command 不应使用 shell 包装命令 "bash"，请直接声明可执行程序',
      '.mcp.json: mcpServers.unsafe.cwd 必须是仓库内相对路径',
      '.mcp.json: mcpServers.unsafe.args[0] 不能指向仓库外路径',
      '.mcp.json: mcpServers.unsafe.args[1] 不能指向仓库外路径',
    ]);
  });
});

test('AI 治理 MCP 配置运行时契约会报告绝对 command 和缺失本地脚本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assertMcpRuntimeConfigFailures(rootDir, '.cursor/mcp.json', {
      mcpServers: {
        local: { command: '/usr/bin/node', args: ['scripts/mcp/missing.js'] },
      },
    }, [
      '.cursor/mcp.json: mcpServers.local.command 不应使用绝对路径，请使用 PATH 中的可执行名',
      '.cursor/mcp.json: mcpServers.local.args[0] 指向的本地脚本不存在: scripts/mcp/missing.js',
    ]);
  });
});

test('AI 治理 MCP 配置运行时契约接受仓库内脚本和环境变量参数', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeLocalMcpScriptFixture(rootDir);
    assertMcpRuntimeConfigFailures(rootDir, '.vscode/mcp.json', {
      servers: {
        local: { command: 'node', args: ['scripts/mcp/local.js', '${MCP_EXTRA_ARG}'] },
      },
    }, []);
  });
});
