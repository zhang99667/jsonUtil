export const CODEX_SKILL_PROFILE_IDS = Object.freeze({
  CORE: 'core',
  MAINTAINER_RUNTIME: 'maintainer-runtime',
  AI_INFRA_EVOLUTION: 'ai-infra-evolution',
});

const PROFILE_DESCRIPTORS = Object.freeze({
  [CODEX_SKILL_PROFILE_IDS.CORE]: Object.freeze({
    id: CODEX_SKILL_PROFILE_IDS.CORE,
    purpose: '未知 skill 的安全核心契约',
  }),
  [CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME]: Object.freeze({
    id: CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME,
    purpose: '项目维护、运行时与发布恢复契约',
  }),
  [CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION]: Object.freeze({
    id: CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION,
    purpose: 'AI 基建 eval、MCP 与治理演进契约',
  }),
});

const EXPLICIT_SKILL_PROFILES = new Map([
  ['.agents/skills/jsonutils-maintainer/SKILL.md', CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME],
  ['.agents/skills/jsonutils-ai-infra-evolver/SKILL.md', CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION],
]);

export const EXPLICIT_CODEX_SKILL_FILES = Object.freeze([...EXPLICIT_SKILL_PROFILES.keys()]);
export const REQUIRED_CODEX_SKILL_EVAL_FILES = Object.freeze(
  EXPLICIT_CODEX_SKILL_FILES.map(file => `${file.slice(0, -'SKILL.md'.length)}evals/evals.json`)
);
export const REQUIRED_CODEX_SKILL_UI_FILES = Object.freeze(
  EXPLICIT_CODEX_SKILL_FILES.map(file => `${file.slice(0, -'SKILL.md'.length)}agents/openai.yaml`)
);

export const hasExplicitCodexSkillProfile = file => EXPLICIT_SKILL_PROFILES.has(file);

export const collectSkillProfileClassificationFailures = file => (
  hasExplicitCodexSkillProfile(file)
    ? []
    : [`${file}: 必须在 aiGovernanceCodexSkillProfiles.mjs 显式声明 skill profile`]
);

export const resolveCodexSkillProfile = file => (
  PROFILE_DESCRIPTORS[EXPLICIT_SKILL_PROFILES.get(file) ?? CODEX_SKILL_PROFILE_IDS.CORE]
);
