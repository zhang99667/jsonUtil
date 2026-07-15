import fs from 'node:fs';
import path from 'node:path';

import { jsonutilsGovernanceTools } from '../mcp/jsonutils-governance-tool-definitions.mjs';

export const CODEX_PROJECT_MCP_CONFIG_FILE = '.codex/config.toml';
const MAX_CONFIG_BYTES = 8 * 1024;
const renderTool = tool => `  ${JSON.stringify(tool.name)},`;
export const CODEX_PROJECT_MCP_BOOTSTRAP = 'import{existsSync}from"node:fs";import{dirname,join}from"node:path";import{pathToFileURL}from"node:url";let d=process.cwd(),f;for(;;){const c=join(d,"scripts/mcp/jsonutils-governance-server.mjs");if(existsSync(c)&&existsSync(join(d,".codex/config.toml"))){f=c;break}const p=dirname(d);if(p===d)throw new Error("JSONUtils governance MCP root not found");d=p}process.chdir(d);const{startJsonutilsGovernanceServer}=await import(pathToFileURL(f).href);startJsonutilsGovernanceServer()';

export const CANONICAL_CODEX_PROJECT_MCP_CONFIG = [
  '#:schema https://developers.openai.com/codex/config-schema.json',
  '',
  '[mcp_servers.jsonutils-governance]',
  'command = "node"',
  'args = [',
  '  "--input-type=module",',
  '  "--eval",',
  `  '${CODEX_PROJECT_MCP_BOOTSTRAP}',`,
  ']',
  'enabled = true',
  'required = true',
  'startup_timeout_sec = 10',
  'tool_timeout_sec = 30',
  'enabled_tools = [',
  ...jsonutilsGovernanceTools.map(renderTool),
  ']',
  '',
].join('\n');

export const collectCodexProjectMcpConfigFailures = (rootDir) => {
  const absolute = path.join(rootDir, CODEX_PROJECT_MCP_CONFIG_FILE);
  try {
    const metadata = fs.lstatSync(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      return [`${CODEX_PROJECT_MCP_CONFIG_FILE}: 必须是普通文件且不能是 symlink`];
    }
    if (metadata.size > MAX_CONFIG_BYTES) {
      return [`${CODEX_PROJECT_MCP_CONFIG_FILE}: 不能超过 ${MAX_CONFIG_BYTES} bytes`];
    }
    return fs.readFileSync(absolute, 'utf8') === CANONICAL_CODEX_PROJECT_MCP_CONFIG
      ? []
      : [`${CODEX_PROJECT_MCP_CONFIG_FILE}: 必须匹配已审计的项目级 MCP canonical 配置`];
  } catch (error) {
    return [`${CODEX_PROJECT_MCP_CONFIG_FILE}: 无法读取（${error.code ?? 'unknown'}）`];
  }
};
