import fs from 'node:fs';
import path from 'node:path';
import { AI_GOVERNANCE_MCP_CONFIG_FILES } from './aiGovernanceDiscoveryPatterns.mjs';
import { collectMcpConfigRuntimeFailures } from './aiGovernanceMcpConfigRuntimeContract.mjs';
import { collectMcpSensitiveValueFailures } from './aiGovernanceMcpSensitiveValues.mjs';

const SERVER_MAP_KEYS = ['mcpServers', 'servers'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const readOptionalFile = (rootDir, file) => fs.existsSync(path.join(rootDir, file))
  ? fs.readFileSync(path.join(rootDir, file), 'utf8')
  : null;

const collectKnownFieldFailures = (file, mapKey, serverName, server) => {
  const prefix = `${mapKey}.${serverName}`;
  return [
    !('command' in server) && !('url' in server) ? `${file}: ${prefix} 必须声明 command 或 url` : null,
    'command' in server && typeof server.command !== 'string' ? `${file}: ${prefix}.command 必须是字符串` : null,
    'url' in server && typeof server.url !== 'string' ? `${file}: ${prefix}.url 必须是字符串` : null,
    'args' in server && (!Array.isArray(server.args) || server.args.some(arg => typeof arg !== 'string')) ? `${file}: ${prefix}.args 必须是字符串数组` : null,
    'env' in server && !isObject(server.env) ? `${file}: ${prefix}.env 必须是对象` : null,
  ].filter(Boolean);
};

const collectServerMapFailures = (file, config) => {
  const presentKeys = SERVER_MAP_KEYS.filter(key => key in config);
  if (presentKeys.length === 0) return [`${file}: MCP 配置必须包含 mcpServers 或 servers 对象`];
  if (presentKeys.length > 1) return [`${file}: MCP 配置只能包含 mcpServers 或 servers 其中一个 server map，避免工具读取边界歧义`];

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
      ...collectMcpSensitiveValueFailures(file, config),
      ...collectMcpConfigRuntimeFailures(rootDir, file, config),
    ];
  })
);
