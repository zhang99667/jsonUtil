import { PROJECT_PLUGIN_SKILL_CONTRACT } from './aiGovernanceProjectPluginSkillContract.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_PROJECT_PLUGIN_BOUNDARY_CASES = Object.freeze({
  [PROJECT_PLUGIN_SKILL_CONTRACT.caseId]: {
    caseVersion: 8,
    subjectVersion: PROJECT_PLUGIN_SKILL_CONTRACT.version,
    evidenceScope: 'component-only',
    evidence: ['canonical/plugin Skill 稳定有界 source、共享官方 optional 字段值语义、项目 JSON 唯一 authority、严格 SemVer、文件+目录聚合快照与 write-lock 写后回滚'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceJsonAuthority.test.mjs',
      'scripts/ci/aiGovernanceSemver.test.mjs',
      'scripts/ci/aiGovernanceSkillOptionalFieldsContract.test.mjs', 'scripts/ci/aiGovernanceSkillYamlAmbiguity.test.mjs',
      'scripts/ci/aiGovernanceSkillUiYamlAmbiguity.test.mjs',
      'scripts/ci/aiGovernanceSkillSourceTextContract.test.mjs',
      'scripts/ci/aiGovernanceSkillUiContract.test.mjs',
      'scripts/ci/aiGovernanceSkillEvalContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginManifestContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginJsonAuthority.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSkillOptionalFields.test.mjs', 'scripts/ci/aiGovernanceProjectPluginSkillSourceContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSkillContract.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginSourceIdentity.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLock.test.mjs',
      'scripts/ci/aiGovernanceProjectPluginLockWriteRace.test.mjs',
    )],
  },
});
