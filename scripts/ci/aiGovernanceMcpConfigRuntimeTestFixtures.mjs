import assert from 'node:assert/strict';

import { collectMcpConfigContractFailures } from './aiGovernanceMcpConfigContract.mjs';
import { writeMcpRuntimeConfigFixture } from './aiGovernanceMcpConfigRuntimeFileTestFixtures.mjs';

export const assertMcpRuntimeConfigFailures = (rootDir, file, config, failures) => {
  writeMcpRuntimeConfigFixture(rootDir, file, config);
  assert.deepEqual(collectMcpConfigContractFailures(rootDir), failures);
};
