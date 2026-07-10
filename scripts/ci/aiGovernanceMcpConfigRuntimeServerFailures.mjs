import path from 'node:path';

import {
  collectMcpArgPathFailures,
  isUnsafeRuntimePath,
  resolveMcpServerBaseDir,
} from './aiGovernanceMcpConfigRuntimeArgFailures.mjs';

const SHELL_COMMANDS = new Set(['sh', 'bash', 'zsh', 'fish', 'cmd', 'cmd.exe', 'powershell', 'powershell.exe', 'pwsh']);

export const collectMcpServerRuntimeFailures = (rootDir, file, prefix, server) => {
  const failures = [];
  if (typeof server.command === 'string') {
    const commandName = path.basename(server.command).toLowerCase();
    if (path.isAbsolute(server.command)) failures.push(`${file}: ${prefix}.command 不应使用绝对路径，请使用 PATH 中的可执行名`);
    if (SHELL_COMMANDS.has(commandName)) failures.push(`${file}: ${prefix}.command 不应使用 shell 包装命令 "${server.command}"，请直接声明可执行程序`);
  }
  if ('cwd' in server && (typeof server.cwd !== 'string' || isUnsafeRuntimePath(server.cwd))) {
    failures.push(`${file}: ${prefix}.cwd 必须是仓库内相对路径`);
  }
  const serverBaseDir = resolveMcpServerBaseDir(rootDir, server.cwd);
  return [...failures, ...collectMcpArgPathFailures(file, prefix, server, serverBaseDir)];
};
