import fs from 'node:fs';
import path from 'node:path';

import {
  AI_GOVERNANCE_PROJECT_PLUGIN_NAMES,
  AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES,
} from './aiGovernanceRequiredProjectPluginFiles.mjs';
import { collectProjectPluginLockFailures } from './aiGovernanceProjectPluginLock.mjs';

const MARKETPLACE_FIELDS = ['name', 'interface', 'plugins'];
const ENTRY_FIELDS = ['name', 'source', 'policy', 'category'];
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const FORBIDDEN_SOURCE_PATTERNS = [
  /(?:^|[^A-Za-z0-9._/-])\/(?:Users|home)\//m,
  /Local developer/,
  /personal-plugin-unverified/,
  /Personal Codex plugin/,
  /Personal, local-only/,
];
const expectedEntry = name => ({
  name,
  source: { source: 'local', path: `./plugins/${name}` },
  policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
  category: name === 'codex-mcp-config-auditor' ? 'Developer Tools' : 'Productivity',
});
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(fields);
const readJson = (rootDir, file, failures) => {
  try { return JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8')); }
  catch { failures.push(`${file}: 必须是可读的合法 JSON`); return null; }
};

export const collectProjectPluginFailures = (rootDir) => {
  const failures = [];
  const missing = AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES.filter(file => !fs.existsSync(path.join(rootDir, file)));
  missing.forEach(file => failures.push(`${file}: 项目插件资产缺失`));
  for (const file of AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES) {
    if (missing.includes(file)) continue;
    const stat = fs.lstatSync(path.join(rootDir, file));
    if (!stat.isFile() || stat.isSymbolicLink()) failures.push(`${file}: 必须是仓库内非符号链接普通文件`);
    const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
    if (FORBIDDEN_SOURCE_PATTERNS.some(pattern => pattern.test(content))) {
      failures.push(`${file}: 项目插件不得使用个人权威身份或绝对用户路径`);
    }
  }
  const marketplace = readJson(rootDir, '.agents/plugins/marketplace.json', failures);
  if (!marketplace) return failures;
  if (!exactFields(marketplace, MARKETPLACE_FIELDS) || marketplace.name !== 'jsonutils-project'
    || !exactFields(marketplace.interface, ['displayName'])
    || marketplace.interface.displayName !== 'JSONUtils Project'
    || !Array.isArray(marketplace.plugins)
    || JSON.stringify(marketplace.plugins) !== JSON.stringify(AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(expectedEntry))) {
    failures.push('.agents/plugins/marketplace.json: 必须是闭字段 jsonutils-project marketplace 且精确登记三个项目插件');
  }
  for (const entry of marketplace.plugins ?? []) {
    if (!exactFields(entry, ENTRY_FIELDS)) failures.push(`plugins/${entry?.name ?? 'unknown'}: marketplace entry 必须闭字段`);
  }
  for (const name of AI_GOVERNANCE_PROJECT_PLUGIN_NAMES) {
    const manifestFile = `plugins/${name}/.codex-plugin/plugin.json`;
    const manifest = readJson(rootDir, manifestFile, failures);
    if (!manifest) continue;
    if (manifest.name !== name || !VERSION_PATTERN.test(manifest.version ?? '')
      || manifest.author?.name !== 'JSONUtils project'
      || manifest.interface?.developerName !== 'JSONUtils project') {
      failures.push(`${manifestFile}: name/version/author/developerName 必须绑定 JSONUtils 项目`);
    }
  }
  const mcpContracts = {
    'plugins/jsonutils-governance-mcp/.mcp.json': {
      mcpServers: { 'jsonutils-governance': { command: 'node', args: ['plugins/jsonutils-governance-mcp/scripts/server.mjs'] } },
    },
    'plugins/codex-mcp-config-auditor/.mcp.json': {
      mcpServers: { 'codex-mcp-config-auditor': { command: 'python3', args: ['plugins/codex-mcp-config-auditor/scripts/server.py'] } },
    },
  };
  for (const [file, expected] of Object.entries(mcpContracts)) {
    const actual = readJson(rootDir, file, failures);
    if (actual && JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${file}: MCP 只能从当前项目根启动固定仓内 runtime`);
    }
  }
  return [...failures, ...collectProjectPluginLockFailures(rootDir)];
};
