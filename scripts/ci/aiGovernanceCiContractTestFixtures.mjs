import { AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS } from './aiGovernanceCiCommandDescriptors.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const activeDescriptors = excludedCommand => AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .filter(({ command }) => command !== excludedCommand);

export const buildAiGovernanceCiWorkflowFixture = (excludedCommand) => [
  'jobs:',
  '  governance:',
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      - uses: actions/checkout@v6',
  '        with:',
  '          fetch-depth: 0',
  ...activeDescriptors(excludedCommand).flatMap(({ command, workflowName }) => [
    `      - name: ${workflowName}`,
    `        run: ${command}`,
  ]),
].join('\n').replace(
  '        run: node scripts/ci/write-ai-governance-artifacts.mjs',
  '        if: always()\n        run: node scripts/ci/write-ai-governance-artifacts.mjs',
);

export const buildAiGovernanceLocalCiFixture = (excludedCommand) => activeDescriptors(excludedCommand)
  .map(({ localCommand, localCiLabel }) => `run_in_root "${localCiLabel}" ${localCommand}`)
  .join('\n');

export const validWorkflow = buildAiGovernanceCiWorkflowFixture();
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
