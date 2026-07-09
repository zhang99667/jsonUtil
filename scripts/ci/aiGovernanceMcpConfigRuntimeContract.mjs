import fs from 'node:fs';
import path from 'node:path';

const SHELL_COMMANDS = new Set(['sh', 'bash', 'zsh', 'fish', 'cmd', 'cmd.exe', 'powershell', 'powershell.exe', 'pwsh']);
const SERVER_MAP_KEYS = ['mcpServers', 'servers'];
const SCRIPT_ARG_PATTERN = /^(?:\.\/|scripts\/|[^-].*\.(?:mjs|cjs|js|ts|tsx|py|sh))$/;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasParentTraversal = value => value.split(/[\\/]+/).includes('..');
const isUnsafePath = value => path.isAbsolute(value) || hasParentTraversal(value);
const isVariableReference = value => value.includes('${') || value.startsWith('$');
const isLocalScriptArg = value => SCRIPT_ARG_PATTERN.test(value) && !isVariableReference(value);

const collectArgPathFailures = (rootDir, file, prefix, server, serverBaseDir) => (
  Array.isArray(server.args) ? server.args.flatMap((arg, index) => {
    if (typeof arg !== 'string') return [];
    const argPath = `${prefix}.args[${index}]`;
    if (isUnsafePath(arg)) return [`${file}: ${argPath} 不能指向仓库外路径`];
    if (isLocalScriptArg(arg) && !fs.existsSync(path.join(serverBaseDir, arg))) {
      return [`${file}: ${argPath} 指向的本地脚本不存在: ${arg}`];
    }
    return [];
  }) : []
);

const collectServerRuntimeFailures = (rootDir, file, prefix, server) => {
  const failures = [];
  if (typeof server.command === 'string') {
    const commandName = path.basename(server.command).toLowerCase();
    if (path.isAbsolute(server.command)) failures.push(`${file}: ${prefix}.command 不应使用绝对路径，请使用 PATH 中的可执行名`);
    if (SHELL_COMMANDS.has(commandName)) failures.push(`${file}: ${prefix}.command 不应使用 shell 包装命令 "${server.command}"，请直接声明可执行程序`);
  }
  if ('cwd' in server && (typeof server.cwd !== 'string' || isUnsafePath(server.cwd))) {
    failures.push(`${file}: ${prefix}.cwd 必须是仓库内相对路径`);
  }
  const serverBaseDir = typeof server.cwd === 'string' && !isUnsafePath(server.cwd) ? path.join(rootDir, server.cwd) : rootDir;
  return [...failures, ...collectArgPathFailures(rootDir, file, prefix, server, serverBaseDir)];
};

export const collectMcpConfigRuntimeFailures = (rootDir, file, config) => (
  SERVER_MAP_KEYS.flatMap((mapKey) => {
    const servers = config[mapKey];
    if (!isObject(servers)) return [];
    return Object.entries(servers).flatMap(([serverName, server]) => (
      isObject(server) ? collectServerRuntimeFailures(rootDir, file, `${mapKey}.${serverName}`, server) : []
    ));
  })
);
