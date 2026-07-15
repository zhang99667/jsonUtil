import {
  resolveExistingContextProjectPath,
} from './aiGovernanceCodexSkillContextPathMeasurement.mjs';
import { measureStableContextReferenceSet } from './aiGovernanceCodexSkillContextReferenceSet.mjs';

const BACKTICK_REFERENCE_PATTERN = /`([^`\n]+)`/g;
const PLAIN_PATH_PATTERN = /(?:^|[^A-Za-z0-9_./-])((?:\.?\.?\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+|(?:AGENTS|CLAUDE)\.md)(?=$|[^A-Za-z0-9_./-])/gm;
const PROJECT_ROOT_PATTERN = /^(?:\.{1,2}\/|\/?(?:\.agents|\.claude|\.codex|\.github|backend|docs|evals|frontend|plugins|rules|scripts)\/)/;
const PROJECT_FILE_PATTERN = /(?:^|\/)[A-Za-z0-9_.-]+\.(?:c?js|jsonl?|jsx|md|mjs|py|sh|toml|tsx?|txt|ya?ml)$/i;
const normalizeReference = reference => reference.trim().split('#', 1)[0].replace(/^\.\//, '').replace(/\/$/, '');
const isProjectPathLike = reference => !reference.includes('://')
  && (PROJECT_ROOT_PATTERN.test(reference) || PROJECT_FILE_PATTERN.test(reference));
const existingProjectReference = (rootDir, rawReference) => {
  const reference = normalizeReference(rawReference);
  const resolved = resolveExistingContextProjectPath(rootDir, reference);
  if (!resolved) {
    if (isProjectPathLike(reference)) throw new Error(`${reference}: 必读上下文项目路径不存在、越界或不可解析`);
    return null;
  }
  return { reference, ...resolved };
};
export const collectMandatoryContextReferences = (rootDir, sectionContent) => {
  const references = [...sectionContent.matchAll(BACKTICK_REFERENCE_PATTERN)]
    .map(([, rawReference]) => existingProjectReference(rootDir, rawReference))
    .filter(Boolean)
    .filter(({ reference }, index, items) => items.findIndex(item => item.reference === reference) === index);
  return measureStableContextReferenceSet(references);
};
export const collectUnquotedMandatoryProjectPaths = (rootDir, sectionContent) => (
  [...sectionContent.replace(BACKTICK_REFERENCE_PATTERN, '').matchAll(PLAIN_PATH_PATTERN)]
    .map(([, rawReference]) => existingProjectReference(rootDir, rawReference)?.reference)
    .filter(Boolean)
    .filter((reference, index, references) => references.indexOf(reference) === index)
);
