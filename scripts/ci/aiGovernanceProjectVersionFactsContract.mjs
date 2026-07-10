import { UNVERIFIABLE_VERSION_FACTS, VERSION_FACTS } from './aiGovernanceProjectVersionFactRules.mjs';
import { packageLockMajor, readExistingFile, sourceMajor } from './aiGovernanceProjectVersionFactSources.mjs';
import {
  collectTargetFailures,
  collectUnverifiableVersionFactFailures,
} from './aiGovernanceProjectVersionFactTargets.mjs';

export const collectAiGovernanceProjectVersionFactFailures = (rootDir) => VERSION_FACTS.flatMap((fact) => {
  const content = readExistingFile(rootDir, fact.sourceFile);
  if (content === null) return [];
  const major = sourceMajor(content, fact);
  if (major === null) return [];
  const lockMajor = fact.packageName ? packageLockMajor(rootDir, fact.packageName) : major;
  const lockFailures = lockMajor === major ? [] : [`frontend/package-lock.json: ${fact.name} 版本事实与 frontend/package.json 不一致，期望主版本 ${major}，实际 ${lockMajor ?? 'missing'}`];
  return [...lockFailures, ...collectTargetFailures(rootDir, fact, major)];
}).concat(collectUnverifiableVersionFactFailures(rootDir, UNVERIFIABLE_VERSION_FACTS));
