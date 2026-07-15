import fs from 'node:fs';

import { parseUniqueJsonAuthority } from './aiGovernanceJsonAuthority.mjs';
import {
  AI_GOVERNANCE_PROJECT_PLUGIN_NAMES,
  AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES,
} from './aiGovernanceRequiredProjectPluginFiles.mjs';
import {
  collectProjectPluginLockFailures,
} from './aiGovernanceProjectPluginLock.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import { collectProjectPluginSkillContractFailures } from './aiGovernanceProjectPluginSkillContract.mjs';
import { collectProjectPluginSourceIdentityFailures } from './aiGovernanceProjectPluginSourceIdentity.mjs';
import { captureProjectPluginTree } from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

const MARKETPLACE_FIELDS = ['name', 'interface', 'plugins'];
const ENTRY_FIELDS = ['name', 'source', 'policy', 'category'];
const VERSION_SOURCE = '\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?';
const VERSIONED_MCP_PLUGINS = ['jsonutils-governance-mcp', 'codex-mcp-config-auditor'];
const PROJECT_PLUGIN_ENTRY_FILES = ['.codex/README.md', '.claude/ai-tools-guide.md'];
const PROJECT_PLUGIN_JSON_MAX_BYTES = 256 * 1024;
const expectedEntry = name => ({
  name,
  source: { source: 'local', path: `./plugins/${name}` },
  policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
  category: name === 'codex-mcp-config-auditor' ? 'Developer Tools' : 'Productivity',
});
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(fields);
const readJson = (rootDir, file, failures) => {
  try {
    const source = readStableUtf8File(rootDir, file, PROJECT_PLUGIN_JSON_MAX_BYTES);
    if (source.status !== 'ok') throw new Error();
    return parseUniqueJsonAuthority(source.content);
  } catch { failures.push(`${file}: 必须是稳定有界、严格 UTF-8 且 authority 唯一的合法 JSON`); return null; }
};
const collectEntryVersionFailures = (rootDir, name, version, failures) => {
  if (!VERSIONED_MCP_PLUGINS.includes(name)) return;
  for (const file of PROJECT_PLUGIN_ENTRY_FILES) {
    let content;
    try { content = fs.readFileSync(resolveProjectPluginRepositoryPath(rootDir, file), 'utf8'); }
    catch { failures.push(`${file}: 项目插件入口版本源必须可读`); continue; }
    const versions = [...new Set([...content.matchAll(new RegExp(`plugins/${name}@(${VERSION_SOURCE})`, 'g'))]
      .map(match => match[1]))];
    if (versions.length !== 1 || versions[0] !== version) {
      failures.push(`${file}: plugins/${name} 入口版本必须精确匹配 manifest ${version}`);
    }
  }
};

export const collectProjectPluginSourceFailures = (rootDir, {
  checkEntryVersions = true, sourceSnapshot,
} = {}) => {
  let snapshot = sourceSnapshot;
  try { snapshot ??= captureProjectPluginTree(rootDir); }
  catch { return ['plugins/: 项目插件完整源码树必须可读且 manifest authority 有效']; }
  const failures = collectProjectPluginSourceIdentityFailures(rootDir, { sourceSnapshot: snapshot });
  for (const file of AI_GOVERNANCE_PROJECT_PLUGIN_SOURCE_FILES) {
    try {
      const absolute = resolveProjectPluginRepositoryPath(rootDir, file);
      const stat = fs.lstatSync(absolute);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        failures.push(`${file}: 必须是仓库内非符号链接普通文件`);
      }
    }
    catch { failures.push(`${file}: 必须是仓库内非符号链接普通文件`); continue; }
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
  if (checkEntryVersions) snapshot.plugins.forEach(plugin => (
    collectEntryVersionFailures(rootDir, plugin.name, plugin.manifestVersion, failures)
  ));
  const mcpContracts = {
    'plugins/jsonutils-governance-mcp/.mcp.json': {
      'jsonutils-governance': { command: 'node', args: ['plugins/jsonutils-governance-mcp/scripts/server.mjs'] },
    },
    'plugins/codex-mcp-config-auditor/.mcp.json': {
      'codex-mcp-config-auditor': { command: 'python3', args: ['plugins/codex-mcp-config-auditor/scripts/server.py'] },
    },
  };
  for (const [file, expected] of Object.entries(mcpContracts)) {
    const actual = readJson(rootDir, file, failures);
    if (actual && JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${file}: 必须使用官方 direct server map 并从当前项目根启动固定仓内 runtime`);
    }
  }
  return [
    ...failures,
    ...collectProjectPluginSkillContractFailures(rootDir, { sourceSnapshot: snapshot }),
  ];
};

export const collectProjectPluginFailures = (rootDir, options = {}) => {
  let sourceSnapshot = options.sourceSnapshot;
  try { sourceSnapshot ??= captureProjectPluginTree(rootDir); }
  catch { /* source collector 会输出固定失败 */ }
  return [
    ...collectProjectPluginSourceFailures(rootDir, { ...options, sourceSnapshot }),
    ...collectProjectPluginLockFailures(rootDir, { sourceSnapshot }),
  ];
};
