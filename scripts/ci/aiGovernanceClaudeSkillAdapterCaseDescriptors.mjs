const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_CLAUDE_SKILL_ADAPTER_CASES = Object.freeze({
  'claude-project-skill-adapter-boundary': {
    caseVersion: 1,
    subjectVersion: '1.0.0',
    evidenceScope: 'component-only',
    evidence: ['普通文件薄 adapter 精确派生 canonical name、description 和读取路径，并拒绝缺失、漂移与 symlink', '静态入口不证明 Claude 真实选择、加载或遵循 skill'],
    argsList: [nodeTest('scripts/ci/aiGovernanceClaudeSkillAdapters.test.mjs')],
  },
});
