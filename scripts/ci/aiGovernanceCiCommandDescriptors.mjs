const ciCommandDescriptor = (command, workflowName, localCiLabel) => ({ command, localCiLabel, workflowName });

export const AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS = [
  ciCommandDescriptor('node scripts/ci/check-version-consistency.mjs', 'Version consistency', 'Governance: version consistency'),
  ciCommandDescriptor('node --test scripts/ci/*.test.mjs', 'Node script unit tests', 'Governance: Node script unit tests'),
  ciCommandDescriptor('node --test scripts/mcp/*.test.mjs', 'MCP server unit tests', 'Governance: MCP server unit tests'),
  ciCommandDescriptor('node scripts/ci/write-ai-governance-artifacts.mjs', 'AI governance artifacts', 'Governance: AI governance artifacts'),
  ciCommandDescriptor('node scripts/ci/check-ai-governance.mjs', 'AI governance coverage', 'Governance: AI playbook and skill links'),
  ciCommandDescriptor('node scripts/ci/check-maintainability-budgets.mjs', 'Maintainability budgets', 'Governance: maintainability budgets'),
];

export const REQUIRED_AI_GOVERNANCE_CI_COMMANDS = AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .map(({ command }) => command);

export const AI_GOVERNANCE_CI_COMMAND_FILES = REQUIRED_AI_GOVERNANCE_CI_COMMANDS
  .map(command => /^node (scripts\/ci\/[^ ]+\.mjs)$/.exec(command)?.[1])
  .filter(Boolean);

const activeDescriptors = excludedCommand => AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .filter(({ command }) => command !== excludedCommand);

export const buildAiGovernanceCiWorkflowFixture = (excludedCommand) => [
  'steps:',
  ...activeDescriptors(excludedCommand).flatMap(({ command, workflowName }) => [
    `  - name: ${workflowName}`,
    `    run: ${command}`,
  ]),
].join('\n');

export const buildAiGovernanceLocalCiFixture = (excludedCommand) => activeDescriptors(excludedCommand)
  .map(({ command, localCiLabel }) => `run_in_root "${localCiLabel}" ${command}`)
  .join('\n');
