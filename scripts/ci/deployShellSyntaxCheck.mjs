import { spawnSync } from 'node:child_process';

import { checkDeployShellFiles } from './deployShellFileChecks.mjs';
import {
  DEFAULT_DEPLOY_SHELL_FILES,
  DEFAULT_GITHUB_WORKFLOW_FILES,
} from './deployShellTargets.mjs';
import { checkGithubWorkflowRuns } from './deployWorkflowRunChecks.mjs';

export const checkDeployShellSyntax = (rootDir, options = {}) => {
  const files = options.files ?? DEFAULT_DEPLOY_SHELL_FILES;
  const workflowFiles = options.workflowFiles ?? DEFAULT_GITHUB_WORKFLOW_FILES;
  const runner = options.runner ?? spawnSync;
  const shellReport = checkDeployShellFiles(rootDir, files, runner);
  const workflowReport = checkGithubWorkflowRuns(rootDir, workflowFiles, runner);

  return {
    checkedFiles: shellReport.checkedFiles,
    checkedHeredocs: shellReport.checkedHeredocs,
    checkedWorkflowRuns: workflowReport.checkedWorkflowRuns,
    failures: [...shellReport.failures, ...workflowReport.failures],
  };
};
