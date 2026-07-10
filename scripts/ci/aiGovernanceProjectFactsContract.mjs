import { collectAiGovernanceProjectDatabaseFactFailures } from './aiGovernanceProjectDatabaseFactsContract.mjs';
import { collectAiGovernanceProjectVersionFactFailures } from './aiGovernanceProjectVersionFactsContract.mjs';

export const collectAiGovernanceProjectFactFailures = (rootDir) => {
  const databaseFailures = collectAiGovernanceProjectDatabaseFactFailures(rootDir);
  const versionFailures = collectAiGovernanceProjectVersionFactFailures(rootDir);
  return [...databaseFailures, ...versionFailures];
};
