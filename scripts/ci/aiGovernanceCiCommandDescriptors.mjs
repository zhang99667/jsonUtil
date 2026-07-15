const ciCommandDescriptor = (command, workflowName, localCiLabel, localCommand = command) => ({ command, localCommand, localCiLabel, workflowName });
const localCiCommandDescriptor = (localCommand, localCiLabel) => ({ command: null, localCommand, localCiLabel, workflowName: null });
export const AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS = [
  ciCommandDescriptor('node scripts/ci/check-version-consistency.mjs', 'Version consistency', 'Governance: version consistency'),
  ciCommandDescriptor('node --test scripts/ci/*.test.mjs', 'Node script unit tests', 'Governance: Node script unit tests'),
  ciCommandDescriptor('node --test scripts/mcp/*.test.mjs', 'MCP server unit tests', 'Governance: MCP server unit tests'),
  ciCommandDescriptor('node --test plugins/ai-infra-controller-probe/skills/probe-codex-controller-runtime/scripts/*.test.mjs', 'Project plugin probe tests', 'Governance: project plugin probe tests'),
  ciCommandDescriptor("python3 -B -m unittest discover -s plugins/codex-mcp-config-auditor/scripts -p 'test_*.py'", 'Project plugin config auditor tests', 'Governance: project plugin config auditor tests'),
  ciCommandDescriptor('node scripts/ci/check-ai-evolution-evals.mjs', 'AI evolution evals', 'Governance: AI evolution evals'),
  ciCommandDescriptor('node scripts/ci/check-ai-asset-distribution.mjs --head', 'AI asset HEAD distribution', 'Governance: AI asset workspace distribution', 'node scripts/ci/check-ai-asset-distribution.mjs --workspace'),
  localCiCommandDescriptor('node scripts/ci/check-ai-validation-whitespace.mjs', 'Governance: workspace whitespace'),
  ciCommandDescriptor('node scripts/ci/write-ai-governance-artifacts.mjs', 'AI governance artifacts', 'Governance: AI governance artifacts'),
  ciCommandDescriptor('node scripts/ci/check-ai-governance.mjs', 'AI governance coverage', 'Governance: AI playbook and skill links'),
  ciCommandDescriptor('node scripts/ci/check-maintainability-budgets.mjs', 'Maintainability budgets', 'Governance: maintainability budgets'),
];
export const REQUIRED_AI_GOVERNANCE_CI_COMMANDS = AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .map(({ command }) => command).filter(Boolean);
export const REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS = AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .map(({ localCommand }) => localCommand);

export const AI_GOVERNANCE_CI_COMMAND_FILES = [...new Set(
  [...REQUIRED_AI_GOVERNANCE_CI_COMMANDS, ...REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS]
  .map(command => /^node (scripts\/ci\/[^ ]+\.mjs)(?:\s|$)/.exec(command)?.[1])
  .filter(Boolean)
)];

const activeDescriptors = excludedCommand => AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .filter(({ command }) => command && command !== excludedCommand);
const activeLocalDescriptors = excludedCommand => AI_GOVERNANCE_CI_COMMAND_DESCRIPTORS
  .filter(({ localCommand }) => localCommand !== excludedCommand);

export const buildAiGovernanceCiWorkflowFixture = (excludedCommand) => [
  'steps:',
  '  - uses: actions/checkout@v6',
  '    with:',
  '      fetch-depth: 0',
  ...activeDescriptors(excludedCommand).flatMap(({ command, workflowName }) => [
    `  - name: ${workflowName}`,
    `    run: ${command}`,
  ]),
].join('\n');

export const buildAiGovernanceLocalCiFixture = (excludedCommand) => activeLocalDescriptors(excludedCommand)
  .map(({ localCommand, localCiLabel }) => `run_in_root "${localCiLabel}" ${localCommand}`)
  .join('\n');
