#!/usr/bin/env node
// 凭据守卫必须在加载任何待测仓库模块之前执行。

const forbiddenSecrets = ['CODEX_API_KEY', 'OPENAI_API_KEY']
  .filter(name => Object.hasOwn(process.env, name));

if (forbiddenSecrets.length > 0) {
  process.stderr.write('Codex fixed MCP preflight 拒绝携带模型凭据的父进程\n');
  process.exitCode = 1;
} else {
  import('./aiGovernanceCodexFixedMcpTrialCli.mjs')
    .then(({ runCodexFixedMcpTrialCli }) => runCodexFixedMcpTrialCli({ argv: process.argv.slice(2) }))
    .then(({ exitCode }) => { process.exitCode = exitCode; })
    .catch((error) => {
      process.stderr.write(`Codex fixed MCP preflight 失败: ${error.message}\n`);
      process.exitCode = 1;
    });
}
