import { collectSkillMetadataContractFailures } from './aiGovernanceCodexSkillMetadataContract.mjs';
import {
  collectUnexpectedSkillFrontmatterFailures,
  extractSkillMetadataBlock,
} from './aiGovernanceCodexSkillMetadata.mjs';
import {
  collectSkillOptionalFieldFailures,
} from './aiGovernanceSkillOptionalFieldsContract.mjs';
import {
  collectSkillFrontmatterAmbiguityFailures,
  collectSkillIdentityValueFailures,
  collectSkillMetadataAmbiguityFailures,
  readSkillIdentity,
} from './aiGovernanceSkillIdentityContract.mjs';

const CODEX_SKILL_FRONTMATTER_FIELDS = ['name', 'description', 'metadata'];

const hasFrontmatterField = (frontmatter, field) => new RegExp(`^${field}:[ \\t]*\\S`, 'm').test(frontmatter);

export const collectSkillFrontmatterContractFailures = (file, frontmatter) => {
  const identity = readSkillIdentity(frontmatter);
  const metadata = extractSkillMetadataBlock(frontmatter);
  const metadataFailures = collectSkillMetadataContractFailures(file, metadata);
  return [
    ...CODEX_SKILL_FRONTMATTER_FIELDS
      .filter(field => field === 'metadata' ? !metadata : !hasFrontmatterField(frontmatter, field))
      .map(field => `${file}: frontmatter 缺少 ${field}`),
    ...collectSkillFrontmatterAmbiguityFailures(file, frontmatter),
    ...collectUnexpectedSkillFrontmatterFailures(file, frontmatter),
    ...collectSkillMetadataAmbiguityFailures(file, frontmatter),
    ...metadataFailures.missingFieldFailures,
    ...collectSkillIdentityValueFailures(file, identity),
    ...collectSkillOptionalFieldFailures(file, frontmatter),
    ...metadataFailures.valueFailures,
  ];
};
