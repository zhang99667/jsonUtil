import {
  buildAiGovernanceCiWorkflowFixture,
  buildAiGovernanceLocalCiFixture,
} from './aiGovernanceCiCommandDescriptors.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

export const validWorkflow = [
  'jobs:',
  '  governance:',
  '    runs-on: ubuntu-latest',
  ...buildAiGovernanceCiWorkflowFixture().split('\n').map(line => `    ${line}`),
].join('\n').replace('        run: node scripts/ci/write-ai-governance-artifacts.mjs', '        if: always()\n        run: node scripts/ci/write-ai-governance-artifacts.mjs');
export const validLocalCi = buildAiGovernanceLocalCiFixture();
export const outcomeWriters = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
];

export const prepareCiFixture = (rootDir, workflow = validWorkflow, localCi = validLocalCi) => {
  writeFixtureFile(rootDir, '.github/workflows/ci.yml', workflow);
  writeFixtureFile(rootDir, 'scripts/ci/local-ci.sh', localCi);
};

export const addWriterStepControl = (workflow, control) => workflow.replace(
  '        if: always()',
  `        if: always()\n        ${control}`,
);
export const addGovernanceJobControl = (workflow, control) => workflow.replace(
  '  governance:',
  `  governance:\n    ${control}`,
);
