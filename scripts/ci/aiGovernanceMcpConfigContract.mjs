import fs from 'node:fs';
import path from 'node:path';
import { AI_GOVERNANCE_MCP_CONFIG_FILES } from './aiGovernanceDiscoveryPatterns.mjs';
import { collectMcpConfigRuntimeFailures } from './aiGovernanceMcpConfigRuntimeContract.mjs';

const SENSITIVE_KEY_PATTERN = /(token|secret|password|api[_-]?key|access[_-]?key|credential)/i;
const VARIABLE_REFERENCE_PATTERN = /^(\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*)$/;
const SERVER_MAP_KEYS = ['mcpServers', 'servers'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const readOptionalFile = (rootDir, file) => fs.existsSync(path.join(rootDir, file))
  ? fs.readFileSync(path.join(rootDir, file), 'utf8')
  : null;

const collectKnownFieldFailures = (file, mapKey, serverName, server) => {
  const prefix = `${mapKey}.${serverName}`;
  return [
    'command' in server && typeof server.command !== 'string' ? `${file}: ${prefix}.command 必须是字符串` : null,
    'args' in server && (!Array.isArray(server.args) || server.args.some(arg => typeof arg !== 'string')) ? `${file}: ${prefix}.args 必须是字符串数组` : null,
    'env' in server && !isObject(server.env) ? `${file}: ${prefix}.env 必须是对象` : null,
  ].filter(Boolean);
};

const collectServerMapFailures = (file, config) => {
  const presentKeys = SERVER_MAP_KEYS.filter(key => key in config);
  if (presentKeys.length === 0) return [`${file}: MCP 配置必须包含 mcpServers 或 servers 对象`];

  return presentKeys.flatMap((mapKey) => {
    const servers = config[mapKey];
    if (!isObject(servers)) return [`${file}: ${mapKey} 必须是对象`];
    if (Object.keys(servers).length === 0) return [`${file}: ${mapKey} 至少包含一个 server`];
    return Object.entries(servers).flatMap(([serverName, server]) => (
      isObject(server)
        ? collectKnownFieldFailures(file, mapKey, serverName, server)
        : [`${file}: ${mapKey}.${serverName} 必须是对象`]
    ));
  });
};

const collectSensitiveValueFailures = (file, value, trail = []) => {
  if (Array.isArray(value)) return value.flatMap((item, index) => collectSensitiveValueFailures(file, item, [...trail, String(index)]));
  if (!isObject(value)) return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childTrail = [...trail, key];
    const keyPath = childTrail.join('.');
    if (SENSITIVE_KEY_PATTERN.test(key) && typeof child === 'string' && !VARIABLE_REFERENCE_PATTERN.test(child)) {
      return [`${file}: 敏感字段 "${keyPath}" 不能写入明文值，请改用环境变量引用`];
    }
    return collectSensitiveValueFailures(file, child, childTrail);
  });
};

export const collectMcpConfigContractFailures = rootDir => (
  AI_GOVERNANCE_MCP_CONFIG_FILES.flatMap((file) => {
    const content = readOptionalFile(rootDir, file);
    if (content === null) return [];
    let config;
    try {
      config = JSON.parse(content);
    } catch {
      return [`${file}: MCP 配置必须是合法 JSON`];
    }
    if (!isObject(config)) return [`${file}: MCP 配置根节点必须是对象`];
    return [
      ...collectServerMapFailures(file, config),
      ...collectSensitiveValueFailures(file, config),
      ...collectMcpConfigRuntimeFailures(rootDir, file, config),
    ];
  })
);
