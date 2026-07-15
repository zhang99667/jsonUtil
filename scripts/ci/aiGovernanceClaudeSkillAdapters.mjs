import fs from 'node:fs';
import path from 'node:path';

import { EXPLICIT_CODEX_SKILL_FILES } from './aiGovernanceCodexSkillProfiles.mjs';

const adapterFileFor = canonicalFile => canonicalFile.replace(/^\.agents\/skills\//, '.claude/skills/');
const frontmatterValue = (content, field) => content
  .match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  ?.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim();

export const CLAUDE_SKILL_ADAPTERS = Object.freeze(EXPLICIT_CODEX_SKILL_FILES.map(canonicalFile => Object.freeze({
  adapterFile: adapterFileFor(canonicalFile),
  canonicalFile,
})));
export const CLAUDE_SKILL_ADAPTER_FILES = Object.freeze(CLAUDE_SKILL_ADAPTERS.map(item => item.adapterFile));

export const renderClaudeSkillAdapter = ({ adapterFile, canonicalFile }, canonicalContent) => {
  const name = frontmatterValue(canonicalContent, 'name');
  const description = frontmatterValue(canonicalContent, 'description');
  if (!name || !description) return null;
  const canonicalReference = path.posix.relative(path.posix.dirname(adapterFile), canonicalFile);
  return [
    '---', `name: ${name}`, `description: ${description}`, '---', '',
    '# JSONUtils Claude Skill Adapter', '',
    '这是 Claude Code 的项目级派生发现入口，不是独立 skill 源码。', '',
    `执行前必须完整读取 \`${canonicalReference}\`，并把该文件作为唯一权威语义；如无法读取，必须停止使用本适配器并明确报告，不得用本文件替代。`, '',
    '此静态适配器只证明项目发现入口和映射契约存在，不证明真实 skill 选择、加载或行为通过。', '',
  ].join('\n');
};

const collectAdapterFailure = (rootDir, descriptor) => {
  const canonicalPath = path.join(rootDir, descriptor.canonicalFile);
  const realRootDir = fs.realpathSync(rootDir);
  let canonicalStat;
  try { canonicalStat = fs.lstatSync(canonicalPath); } catch (error) {
    if (error.code === 'ENOENT') return [`${descriptor.canonicalFile}: Claude skill adapter 缺少 canonical source`];
    throw error;
  }
  if (canonicalStat.isSymbolicLink() || !canonicalStat.isFile()
    || fs.realpathSync(canonicalPath) !== path.join(realRootDir, descriptor.canonicalFile)) {
    return [`${descriptor.canonicalFile}: Claude skill adapter canonical source 必须是普通文件`];
  }
  const expected = renderClaudeSkillAdapter(descriptor, fs.readFileSync(canonicalPath, 'utf8'));
  if (!expected) return [`${descriptor.canonicalFile}: Claude skill adapter 无法派生 name/description`];
  const adapterPath = path.join(rootDir, descriptor.adapterFile);
  let stat;
  try { stat = fs.lstatSync(adapterPath); } catch (error) {
    if (error.code === 'ENOENT') return [`${descriptor.adapterFile}: Claude skill adapter 文件不存在`];
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()
    || fs.realpathSync(adapterPath) !== path.join(realRootDir, descriptor.adapterFile)) {
    return [`${descriptor.adapterFile}: Claude skill adapter 必须是普通文件`];
  }
  return fs.readFileSync(adapterPath, 'utf8') === expected
    ? [] : [`${descriptor.adapterFile}: Claude skill adapter 必须由 canonical source 按固定模板派生`];
};

export const collectClaudeSkillAdapterFailures = rootDir => (
  CLAUDE_SKILL_ADAPTERS.flatMap(descriptor => collectAdapterFailure(rootDir, descriptor))
);
