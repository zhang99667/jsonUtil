import fs from 'node:fs';
import path from 'node:path';

const BACKTICK_REFERENCE_PATTERN = /`([^`\n]+)`/g;
const PLAIN_PATH_PATTERN = /(?:^|[^A-Za-z0-9_./-])((?:\.?\.?\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+|(?:AGENTS|CLAUDE)\.md)(?=$|[^A-Za-z0-9_./-])/gm;

const normalizeReference = reference => reference.trim().split('#', 1)[0].replace(/^\.\//, '').replace(/\/$/, '');

const resolveProjectPath = (rootDir, reference) => {
  if (!reference || path.isAbsolute(reference) || /[\s*{}<>]/.test(reference) || reference.includes('://')) {
    return null;
  }
  const target = path.resolve(rootDir, reference);
  const relative = path.relative(path.resolve(rootDir), target);
  return relative.startsWith('..') || path.isAbsolute(relative) ? null : target;
};

const measurePathBytes = (target) => {
  const stat = fs.lstatSync(target);
  if (!stat.isDirectory()) return stat.size;
  return fs.readdirSync(target, { withFileTypes: true }).reduce((total, entry) => (
    total + measurePathBytes(path.join(target, entry.name))
  ), 0);
};

const existingProjectReference = (rootDir, rawReference) => {
  const reference = normalizeReference(rawReference);
  const target = resolveProjectPath(rootDir, reference);
  return target && fs.existsSync(target) ? { reference, target } : null;
};

export const collectMandatoryContextReferences = (rootDir, sectionContent) => {
  const references = [...sectionContent.matchAll(BACKTICK_REFERENCE_PATTERN)]
    .map(([, rawReference]) => existingProjectReference(rootDir, rawReference))
    .filter(Boolean)
    .filter(({ reference }, index, items) => items.findIndex(item => item.reference === reference) === index);
  return references.map(({ reference, target }) => ({ reference, bytes: measurePathBytes(target) }));
};

export const collectUnquotedMandatoryProjectPaths = (rootDir, sectionContent) => (
  [...sectionContent.replace(BACKTICK_REFERENCE_PATTERN, '').matchAll(PLAIN_PATH_PATTERN)]
    .map(([, rawReference]) => existingProjectReference(rootDir, rawReference)?.reference)
    .filter(Boolean)
    .filter((reference, index, references) => references.indexOf(reference) === index)
);
