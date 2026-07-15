import { CODEX_PROJECT_COMMAND_RULES_CONTRACT } from './aiGovernanceCodexCommandRules.mjs';

export const AI_EVOLUTION_CODEX_COMMAND_RULE_CASES = Object.freeze({
  [CODEX_PROJECT_COMMAND_RULES_CONTRACT.caseId]: {
    caseVersion: 1,
    subjectVersion: CODEX_PROJECT_COMMAND_RULES_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['canonical prompt-only prefix rules、inline match/not_match、普通文件与信任/加载/执行负声明'],
    argsList: [['--test', 'scripts/ci/aiGovernanceCodexCommandRules.test.mjs']],
  },
});
