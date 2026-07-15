import { collectSkillEvalContractFailures } from './aiGovernanceCodexSkillEvalContract.mjs';
import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import { captureProjectPluginTree, sameProjectPluginTreeSnapshots } from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { validateProjectPluginManifestFile } from './aiGovernanceProjectPluginManifestContract.mjs';
import { discoverProjectPluginSkillFiles } from './aiGovernanceProjectPluginSkillDiscovery.mjs';
import {
  collectProjectPluginSkillCompanionPathFailures,
  readProjectPluginSkillText,
} from './aiGovernanceProjectPluginSkillPaths.mjs';
import {
  collectSkillFrontmatterAmbiguityFailures,
  collectSkillIdentityValueFailures,
  collectSkillMetadataAmbiguityFailures,
  readSkillIdentity,
} from './aiGovernanceSkillIdentityContract.mjs';
import { collectUnexpectedSkillFrontmatterFailures } from './aiGovernanceCodexSkillMetadata.mjs';
import { collectSkillOptionalFieldFailures } from './aiGovernanceSkillOptionalFieldsContract.mjs';

const MANIFEST_FILE = 'plugins/ai-infra-controller-probe/.codex-plugin/plugin.json';

export const PROJECT_PLUGIN_SKILL_CONTRACT = Object.freeze({
  caseId: 'project-plugin-skill-semantic-contract-boundary', version: '1.7.0',
});

const collectFrontmatterFailures = (rootDir, skillFile) => {
  let content;
  try {
    content = readProjectPluginSkillText(rootDir, skillFile);
  } catch {
    return [`${skillFile}: 无法读取 skill`];
  }
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (frontmatter === undefined) return [`${skillFile}: 缺少 skill frontmatter`];

  const identity = readSkillIdentity(frontmatter);
  return [
    ...collectSkillFrontmatterAmbiguityFailures(skillFile, frontmatter),
    ...collectUnexpectedSkillFrontmatterFailures(skillFile, frontmatter),
    ...collectSkillMetadataAmbiguityFailures(skillFile, frontmatter),
    ...(!identity.rawName?.trim() ? [`${skillFile}: frontmatter name 不能为空`] : []),
    ...(!identity.rawDescription?.trim()
      ? [`${skillFile}: frontmatter description 不能为空`] : []),
    ...collectSkillIdentityValueFailures(skillFile, identity),
    ...collectSkillOptionalFieldFailures(skillFile, frontmatter),
  ];
};

export const collectProjectPluginSkillContractFailures = (rootDir, { sourceSnapshot } = {}) => {
  const manifestFailures = validateProjectPluginManifestFile(rootDir, MANIFEST_FILE, 'ai-infra-controller-probe').failures;
  if (manifestFailures.length > 0) return manifestFailures;
  let baseline, baselineInvalid = false;
  try { baseline = sourceSnapshot ?? captureProjectPluginTree(rootDir); }
  catch { baselineInvalid = true; }
  const discovered = discoverProjectPluginSkillFiles(rootDir);
  if (discovered.failures.length > 0) return discovered.failures;
  const pathFailures = discovered.skillFiles.flatMap(skillFile => (
    collectProjectPluginSkillCompanionPathFailures(rootDir, skillFile)));
  if (pathFailures.length > 0) return pathFailures;
  if (baselineInvalid) return ['plugins/: 项目插件源码快照在 Skill 语义校验前无效'];
  const failures = [
    ...discovered.skillFiles.flatMap(skillFile => [
      ...collectFrontmatterFailures(rootDir, skillFile),
      ...collectSkillUiContractFailures(rootDir, skillFile, { required: true }),
      ...collectSkillEvalContractFailures(rootDir, skillFile, { required: true }),
    ]),
  ];
  try {
    if (!sameProjectPluginTreeSnapshots(baseline, captureProjectPluginTree(rootDir))) {
      failures.push('plugins/: 项目插件源码在 Skill 语义校验期间发生变化');
    }
  } catch { failures.push('plugins/: 项目插件源码在 Skill 语义校验期间发生变化'); }
  return failures;
};
