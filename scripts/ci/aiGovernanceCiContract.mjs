import fs from 'node:fs';
import path from 'node:path';
import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

const REQUIRED_AI_GOVERNANCE_CI_COMMANDS = ['node scripts/ci/check-version-consistency.mjs',
  'node --test scripts/ci/*.test.mjs', 'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-maintainability-budgets.mjs'];

const collectExecutableLines = content => content.split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'));

const collectWorkflowCommands = content => collectExecutableLines(
  collectGithubWorkflowRunBlocks(content).map(block => block.content).join('\n')
);

const collectLocalCiCommands = content => collectExecutableLines(content)
  .flatMap(line => /^run_in_root\s+"[^"]+"\s+(.+)$/.exec(line)?.[1].trim() ?? []);

const CI_COMMAND_COLLECTORS = {
  '.github/workflows/ci.yml': collectWorkflowCommands,
  'scripts/ci/local-ci.sh': collectLocalCiCommands,
};

export const collectAiGovernanceCiContractFailures = (rootDir) => (
  Object.entries(CI_COMMAND_COLLECTORS).flatMap(([file, collectCommands]) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [`${file}: 缺少 AI 治理自动化入口`];

    const commands = new Set(collectCommands(fs.readFileSync(filePath, 'utf8')));
    return REQUIRED_AI_GOVERNANCE_CI_COMMANDS
      .filter(command => !commands.has(command))
      .map(command => `${file}: 缺少 AI 治理自动化命令 "${command}"`);
  })
);
