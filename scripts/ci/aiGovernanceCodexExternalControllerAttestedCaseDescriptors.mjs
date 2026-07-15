import { CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT } from './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';

export const AI_EVOLUTION_CODEX_ATTESTED_CONTROLLER_CASES = Object.freeze({
  [CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.caseId]: {
    caseVersion: 1,
    subjectVersion: CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.version,
    evidenceScope: 'component-only',
    evidence: ['闭字段 host record、双角色 DSSE、七角色 UID/GID/namespace、派生 state/challenge、policy path candidate、pre-runtime 注入与过度声明负例'],
    argsList: [['--test', 'scripts/ci/aiGovernanceCodexExternalControllerAttestedPreflight.test.mjs']],
  },
});
