import { buildRegistryCoverageFailures } from './aiGovernanceAssetRegistryCoverageFailures.mjs';
import {
  buildDuplicateRegistryFailures,
  buildStaleRegistryFailures,
} from './aiGovernanceAssetRegistryLifecycleFailures.mjs';

export const buildAiGovernanceAssetRegistryFailures = ({ duplicateFiles, evidenceContext, registryRows }) => [
  ...buildDuplicateRegistryFailures(duplicateFiles),
  ...buildStaleRegistryFailures(registryRows, evidenceContext.expectedRegistryFiles),
  ...buildRegistryCoverageFailures(registryRows, evidenceContext),
];
