import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

const collectExecutableLines = content => content.split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'));

const collectWorkflowCommands = content => collectExecutableLines(
  collectGithubWorkflowRunBlocks(content).map(block => block.content).join('\n')
);

const collectLocalCiCommands = content => collectExecutableLines(content)
  .flatMap(line => /^run_in_root\s+"[^"]+"\s+(.+)$/.exec(line)?.[1].trim() ?? []);

export const CI_COMMAND_COLLECTORS = {
  '.github/workflows/ci.yml': collectWorkflowCommands,
  'scripts/ci/local-ci.sh': collectLocalCiCommands,
};
