import fs from 'node:fs';
import path from 'node:path';

import {
  AI_GOVERNANCE_PROJECT_AI_INFRA_AUDITOR_REQUIRED_FILES,
  PROJECT_AI_INFRA_AUDITOR_CONTRACT,
  collectProjectAiInfraAuditorFailures,
} from './aiGovernanceProjectAiInfraAuditor.mjs';

const PROFILE_DIR = '.codex/agents';
const MAX_PROFILE_BYTES = 8 * 1024;
const PROFILE_PATTERN = /^name = "([^"\n]+)"\ndescription = "([^"\n]+)"\nsandbox_mode = "([^"\n]+)"\nnickname_candidates = \[([^\n]*)\]\n\ndeveloper_instructions = """\n([\s\S]+)\n"""\n$/;
const SAFE_NICKNAME = /^[A-Za-z0-9 _-]{1,32}$/;
const COMMON_SNIPPETS = ['读写范围', '排除项', '未覆盖风险', '主线程', 'sandbox_mode 只是角色默认值', 'permission override', '无论实际 permission mode', '不能把 profile 当成隔离证明', '任务：', '结论：', '证据：', '修改文件：', '验证：', '未覆盖：', '下一步建议：'];

export const CODEX_AGENT_PROFILE_CONTRACT = Object.freeze({
  caseId: 'codex-project-agent-profile-boundary',
  version: PROJECT_AI_INFRA_AUDITOR_CONTRACT.version,
});

export const CODEX_AGENT_PROFILES = Object.freeze({
  [PROJECT_AI_INFRA_AUDITOR_CONTRACT.name]: {
    file: PROJECT_AI_INFRA_AUDITOR_CONTRACT.codexFile,
    sandboxMode: 'read-only',
    requiredSnippets: ['AI 协作基建专项只读审计', 'jsonutils-ai-infra-evolver/SKILL.md', '普通业务功能', '只使用读取与搜索能力', 'behavior outcome 保持 unknown'],
  },
  explorer: {
    file: `${PROFILE_DIR}/explorer.toml`,
    sandboxMode: 'read-only',
    requiredSnippets: ['只读调查', '禁止编辑', '完整 workspace manifest', '有界状态样本不能证明零写入', 'codex-mcp-config-auditor', 'unavailable'],
  },
  worker: {
    file: `${PROFILE_DIR}/worker.toml`,
    sandboxMode: 'workspace-write',
    requiredSnippets: ['写入白名单', '边界不足', '保护共享脏工作树', '不得用计划命令冒充已执行结果'],
  },
  verifier: {
    file: `${PROFILE_DIR}/verifier.toml`,
    sandboxMode: 'workspace-write',
    requiredSnippets: ['只运行父任务明确列出的验证命令', '不修改源码', '失败时只诊断', '原始 MCP 清单'],
  },
});

export const AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES = Object.freeze(
  Object.values(CODEX_AGENT_PROFILES).map(profile => profile.file)
);

export const AI_GOVERNANCE_CODEX_AGENT_REQUIRED_FILES = Object.freeze([
  ...AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES,
  'scripts/ci/aiGovernanceCodexAgentProfiles.mjs',
  'scripts/ci/aiGovernanceCodexAgentCaseDescriptors.mjs',
  'scripts/ci/aiGovernanceCodexAgentProfiles.test.mjs',
  ...AI_GOVERNANCE_PROJECT_AI_INFRA_AUDITOR_REQUIRED_FILES,
  'scripts/ci/maintainability-budget-governance-ai-agent-profile-rules.mjs',
]);

const parseProfile = (text) => {
  const match = PROFILE_PATTERN.exec(text);
  if (!match) return null;
  let nicknames;
  try { nicknames = JSON.parse(`[${match[4]}]`); } catch { return null; }
  return {
    name: match[1],
    description: match[2],
    sandboxMode: match[3],
    nicknames,
    developerInstructions: match[5],
  };
};

const readProfile = (rootDir, file) => {
  const absolute = path.join(rootDir, file);
  try {
    const metadata = fs.lstatSync(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return { failure: `${file}: 必须是普通文件且不能是 symlink` };
    if (metadata.size > MAX_PROFILE_BYTES) return { failure: `${file}: 不能超过 ${MAX_PROFILE_BYTES} bytes` };
    return { profile: parseProfile(fs.readFileSync(absolute, 'utf8')) };
  } catch (error) {
    return { failure: `${file}: 无法读取（${error.code ?? 'unknown'}）` };
  }
};

const collectProfileFailures = (rootDir, name, contract, allNicknames) => {
  const { profile, failure } = readProfile(rootDir, contract.file);
  if (failure) return [failure];
  if (!profile) return [`${contract.file}: 必须使用固定顺序和闭字段 canonical TOML`];
  const failures = [];
  if (profile.name !== name) failures.push(`${contract.file}: name 必须等于文件名 ${name}`);
  if (profile.description.length < 20 || profile.description.length > 200) failures.push(`${contract.file}: description 长度必须在 20 到 200 之间`);
  if (profile.sandboxMode !== contract.sandboxMode) failures.push(`${contract.file}: sandbox_mode 必须为 ${contract.sandboxMode}`);
  if (!Array.isArray(profile.nicknames) || profile.nicknames.length !== 3
    || new Set(profile.nicknames).size !== profile.nicknames.length
    || !profile.nicknames.every(item => typeof item === 'string' && SAFE_NICKNAME.test(item))) {
    failures.push(`${contract.file}: nickname_candidates 必须是 3 个唯一安全名称`);
  } else {
    profile.nicknames.forEach((nickname) => {
      if (allNicknames.has(nickname)) failures.push(`${contract.file}: nickname ${nickname} 不能跨 profile 重复`);
      allNicknames.add(nickname);
    });
  }
  [...COMMON_SNIPPETS, ...contract.requiredSnippets].forEach((snippet) => {
    if (!profile.developerInstructions.includes(snippet)) failures.push(`${contract.file}: developer_instructions 缺少 ${snippet}`);
  });
  return failures;
};

export const collectCodexAgentProfileFailures = (rootDir) => {
  const expectedFiles = AI_GOVERNANCE_CODEX_AGENT_PROFILE_FILES.map(file => path.basename(file)).sort();
  const auditorFile = path.basename(PROJECT_AI_INFRA_AUDITOR_CONTRACT.codexFile);
  let actualFiles = [];
  try { actualFiles = fs.readdirSync(path.join(rootDir, PROFILE_DIR)).sort(); } catch { /* 逐文件错误给出稳定诊断 */ }
  const failures = collectProjectAiInfraAuditorFailures(rootDir);
  expectedFiles.filter(file => file !== auditorFile && !actualFiles.includes(file)).forEach(file => failures.push(`${PROFILE_DIR}/${file}: 缺少固定 Codex agent profile`));
  actualFiles.filter(file => !expectedFiles.includes(file)).forEach(file => failures.push(`${PROFILE_DIR}/${file}: 未审计的 Codex agent profile`));
  const allNicknames = new Set();
  for (const [name, contract] of Object.entries(CODEX_AGENT_PROFILES)) {
    if (actualFiles.includes(path.basename(contract.file))) failures.push(...collectProfileFailures(rootDir, name, contract, allNicknames));
  }
  return failures;
};
