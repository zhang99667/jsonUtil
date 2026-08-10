import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hashJsonutilsValidationCommandDescriptor } from './aiGovernanceValidationCommandRegistry.mjs';
import {
  captureAiGovernanceValidationExecutionState,
  observeAiGovernanceValidationExecutionState,
} from './aiGovernanceValidationExecutionState.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const revision = `worktree-${'a'.repeat(64)}`;
export const stateA = 'b'.repeat(64);
export const stateB = 'c'.repeat(64);
export const ledgerSnapshot = [
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
].map((ledgerPath, index) => ({
  path: ledgerPath,
  dev: '1', ino: String(index + 1), mode: '33188', size: '10', mtimeNs: '20', ctimeNs: '30',
  sha256: String(index + 1).repeat(64),
}));
const descriptor = Object.freeze({
  executable: 'node',
  argv: Object.freeze(['scripts/ci/check-ai-governance.mjs']),
  envProfile: 'jsonutils-validation-node-v1',
  timeout: 60_000,
});
export const fixtureCommand = Object.freeze({
  id: 'fixture-command',
  displayCommand: 'fixture command',
  descriptor,
  descriptorSha256: hashJsonutilsValidationCommandDescriptor(descriptor),
});

export const changedSet = (paths = ['AGENTS.md'], stateSha256 = stateA) => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-changed-set',
  ok: true,
  changedFileCount: paths.length,
  counts: { staged: 0, worktree: paths.length, untracked: 0, blocked: 0 },
  allFiles: paths.map(file => ({ path: file, changes: ['worktree-content'] })),
  issues: [],
  ...(stateSha256 === null ? {} : { stateSha256 }),
});

export const plan = ({ changedSet: current }, { manual = false, unclassified = 0 } = {}) => ({
  schemaVersion: 1,
  reportType: 'jsonutils-validation-plan',
  ok: true,
  authority: { profile: 'raw-head-index-worktree-v1', authoritative: true, issueCount: 0 },
  changedFileCount: current.changedFileCount,
  truncated: false,
  coverage: {
    sampledFileCount: current.changedFileCount,
    totalChangedFileCount: current.changedFileCount,
    truncated: false,
    commandMatchScope: 'all',
    unclassifiedFilesScope: 'all',
  },
  commands: [{ command: fixtureCommand.displayCommand, reason: 'fixture' }],
  manualChecks: manual ? [{ id: 'fixture-manual', reason: 'fixture' }] : [],
  matchedRules: [],
  unclassifiedFiles: [],
  unclassifiedFileCount: unclassified,
  unclassifiedFilesTruncated: false,
});

const rootBinding = {
  realPath: rootDir,
  identity: { dev: '1', ino: '2', mode: '40755', uid: '1', gid: '1' },
  identitySha256: 'd'.repeat(64),
};
const fakeBindings = commands => ({
  byExecutable: Object.fromEntries([...new Set(commands.map(item => item.descriptor.executable))].map(logicalName => [
    logicalName,
    {
      logicalName,
      realPath: `/trusted/${logicalName}`,
      pathSha256: 'e'.repeat(64),
      sha256: 'f'.repeat(64),
      stat: { dev: '1', ino: '2', mode: '100755' },
    },
  ])),
  safePath: '/usr/bin:/bin',
  setSha256: '1'.repeat(64),
});
let runtimeSequence = 0;
export const fakeRuntime = () => {
  runtimeSequence += 1;
  const root = `/runtime/${runtimeSequence}`;
  return { root, home: `${root}/home`, codex: `${root}/codex`, docker: `${root}/docker`, tmp: `${root}/tmp` };
};

export const dependencies = (collectChangedSet, overrides = {}) => {
  const stateKeys = new Set([
    'collectChangedSet', 'buildPlan', 'resolveCommands', 'resolveRevision', 'snapshotLedgers', 'validateRoot',
  ]);
  const stateOverrides = Object.fromEntries(Object.entries(overrides.dependencies ?? {})
    .filter(([key]) => stateKeys.has(key)));
  const executionOverrides = Object.fromEntries(Object.entries(overrides.dependencies ?? {})
    .filter(([key]) => !stateKeys.has(key)));
  const stateProviders = {
    collectChangedSet,
    buildPlan: input => plan(input, overrides.planOptions),
    resolveCommands: () => [fixtureCommand],
    resolveRevision: () => revision,
    snapshotLedgers: async () => ledgerSnapshot,
    validateRoot: () => true,
    ...stateOverrides,
  };
  return {
    rootDir,
    stateProviders,
    captureState: options => captureAiGovernanceValidationExecutionState({ ...stateProviders, ...options }),
    observeState: options => observeAiGovernanceValidationExecutionState({ ...stateProviders, ...options }),
    resolveRoot: () => rootBinding,
    validateRoot: () => true,
    bindExecutables: ({ commands }) => fakeBindings(commands),
    validateBindings: () => true,
    createRuntime: fakeRuntime,
    validateRuntime: () => true,
    cleanupRuntime: () => true,
    ...executionOverrides,
  };
};
