import { parseUniqueJsonAuthority } from './aiGovernanceJsonAuthority.mjs';
import { isStrictSemver } from './aiGovernanceSemver.mjs';
import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

const ROOT_FIELDS = ['name', 'version', 'description', 'author', 'interface'];
const INTERFACE_FIELDS = [
  'displayName', 'shortDescription', 'longDescription', 'developerName',
  'category', 'capabilities', 'defaultPrompt',
];
const MANIFEST_SPECS = Object.freeze({
  'ai-infra-controller-probe': Object.freeze({
    route: ['skills', './skills/'], category: 'Productivity', capabilities: [],
  }),
  'jsonutils-governance-mcp': Object.freeze({
    route: ['mcpServers', './.mcp.json'], category: 'Productivity', capabilities: ['Read'],
  }),
  'codex-mcp-config-auditor': Object.freeze({
    route: ['mcpServers', './.mcp.json'], category: 'Developer Tools', capabilities: ['Read'],
  }),
});

export const PROJECT_PLUGIN_MANIFEST_MAX_BYTES = 64 * 1024;

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasExactFields = (value, fields) => isRecord(value)
  && Object.keys(value).length === fields.length
  && fields.every(field => Object.hasOwn(value, field));
const isBoundedString = (value, max = 4096) => typeof value === 'string'
  && value.trim().length > 0 && value.length <= max;

export const parseProjectPluginJsonAuthority = parseUniqueJsonAuthority;

const hasValidInterface = (value, spec) => hasExactFields(value, INTERFACE_FIELDS)
  && ['displayName', 'shortDescription', 'longDescription'].every(field => isBoundedString(value[field]))
  && value.developerName === 'JSONUtils project' && value.category === spec.category
  && JSON.stringify(value.capabilities) === JSON.stringify(spec.capabilities)
  && Array.isArray(value.defaultPrompt) && value.defaultPrompt.length > 0
  && value.defaultPrompt.length <= 8 && value.defaultPrompt.every(item => isBoundedString(item, 1024))
  && new Set(value.defaultPrompt).size === value.defaultPrompt.length;

export const validateProjectPluginManifestBytes = ({ bytes, name, file }) => {
  const failure = `${file}: 必须是稳定有界、闭字段、唯一键且类型有效的项目 plugin manifest`;
  try {
    if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > PROJECT_PLUGIN_MANIFEST_MAX_BYTES) {
      throw new TypeError();
    }
    const manifest = parseProjectPluginJsonAuthority(bytes);
    const spec = MANIFEST_SPECS[name];
    if (!spec) throw new TypeError();
    const [routeField, routeValue] = spec.route;
    if (!hasExactFields(manifest, [...ROOT_FIELDS, routeField])
      || manifest.name !== name || !isStrictSemver(manifest.version)
      || !isBoundedString(manifest.description, 1024)
      || !hasExactFields(manifest.author, ['name']) || manifest.author.name !== 'JSONUtils project'
      || manifest[routeField] !== routeValue || !hasValidInterface(manifest.interface, spec)) throw new TypeError();
    return { manifest, failures: [] };
  } catch {
    return { manifest: null, failures: [failure] };
  }
};

export const validateProjectPluginManifestFile = (rootDir, file, name) => {
  const source = readStableUtf8File(rootDir, file, PROJECT_PLUGIN_MANIFEST_MAX_BYTES);
  return validateProjectPluginManifestBytes({
    bytes: source.status === 'ok' ? Buffer.from(source.content, 'utf8') : null, name, file,
  });
};
