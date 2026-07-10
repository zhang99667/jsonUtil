import fs from 'node:fs';
import path from 'node:path';

const SCRIPT_ARG_PATTERN = /^(?:\.\/|scripts\/|[^-].*\.(?:mjs|cjs|js|ts|tsx|py|sh))$/;

const hasParentTraversal = value => value.split(/[\\/]+/).includes('..');
export const isUnsafeRuntimePath = value => path.isAbsolute(value) || hasParentTraversal(value);
const isVariableReference = value => value.includes('${') || value.startsWith('$');
const isLocalScriptArg = value => SCRIPT_ARG_PATTERN.test(value) && !isVariableReference(value);

export const resolveMcpServerBaseDir = (rootDir, cwd) => (
  typeof cwd === 'string' && !isUnsafeRuntimePath(cwd) ? path.join(rootDir, cwd) : rootDir
);

export const collectMcpArgPathFailures = (file, prefix, server, serverBaseDir) => (
  Array.isArray(server.args) ? server.args.flatMap((arg, index) => {
    if (typeof arg !== 'string') return [];
    const argPath = `${prefix}.args[${index}]`;
    if (isUnsafeRuntimePath(arg)) return [`${file}: ${argPath} 不能指向仓库外路径`];
    if (isLocalScriptArg(arg) && !fs.existsSync(path.join(serverBaseDir, arg))) {
      return [`${file}: ${argPath} 指向的本地脚本不存在: ${arg}`];
    }
    return [];
  }) : []
);
