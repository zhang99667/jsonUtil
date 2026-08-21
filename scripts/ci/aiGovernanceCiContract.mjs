import { CI_COMMAND_COLLECTORS } from './aiGovernanceCiCommandCollectors.mjs';
import { REQUIRED_AI_GOVERNANCE_CI_COMMANDS, REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS } from './aiGovernanceCiCommandDescriptors.mjs';
import { readAiGovernanceCiEntrySource } from './aiGovernanceCiEntrySource.mjs';
import {
  collectOutcomeWriterAutomationWriteFailures,
  collectRequiredWorkflowCommandReachabilityFailures,
  collectWorkflowFullHistoryCheckoutFailures,
} from './aiGovernanceAutomationCommandContract.mjs';
import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

export const collectAiGovernanceCiContractFailures = rootDir => Object.entries(CI_COMMAND_COLLECTORS)
  .flatMap(([file, collectCommands]) => {
    const source = readAiGovernanceCiEntrySource(rootDir, file);
    if (source.failures.length > 0) return source.failures;
    const content = source.content;
    const commands = new Set(collectCommands(content));
    const requiredCommands = file === 'scripts/ci/local-ci.sh'
      ? REQUIRED_AI_GOVERNANCE_LOCAL_COMMANDS : REQUIRED_AI_GOVERNANCE_CI_COMMANDS;
    const failures = requiredCommands
      .filter(command => !commands.has(command))
      .map(command => `${file}: 缺少 AI 治理自动化命令 "${command}"`);
    const commandBlocks = file === '.github/workflows/ci.yml'
      ? collectGithubWorkflowRunBlocks(content).map(block => block.content)
      : [...commands];
    failures.push(...collectOutcomeWriterAutomationWriteFailures(commandBlocks, file));
    if (file === '.github/workflows/ci.yml') {
      failures.push(...collectRequiredWorkflowCommandReachabilityFailures(content, requiredCommands, file));
      failures.push(...collectWorkflowFullHistoryCheckoutFailures(content, file));
    }
    return failures;
  });
