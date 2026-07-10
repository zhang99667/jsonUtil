import { collectMcpServerRuntimeFailures } from './aiGovernanceMcpConfigRuntimeServerFailures.mjs';

const SERVER_MAP_KEYS = ['mcpServers', 'servers'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export const collectMcpConfigRuntimeFailures = (rootDir, file, config) => (
  SERVER_MAP_KEYS.flatMap((mapKey) => {
    const servers = config[mapKey];
    if (!isObject(servers)) return [];
    return Object.entries(servers).flatMap(([serverName, server]) => (
      isObject(server) ? collectMcpServerRuntimeFailures(rootDir, file, `${mapKey}.${serverName}`, server) : []
    ));
  })
);
