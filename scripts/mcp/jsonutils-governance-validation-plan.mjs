import { buildJsonutilsWorktreeSnapshot } from './jsonutils-governance-worktree.mjs';
import { collectAuthoritativeValidationChangedSet } from '../ci/aiGovernanceValidationChangedSet.mjs';
import {
  collectClassifiedValidationPaths,
  matchJsonutilsValidationRules,
  uniqueValidationCommands,
  uniqueValidationManualChecks,
} from './jsonutils-governance-validation-rules.mjs';

const sampled = (items, limit = 20) => ({ items: items.slice(0, limit), count: items.length, truncated: items.length > limit });

const adaptAuthoritativeChangedSet = (changedSet, maxFiles) => {
  const allFiles = (changedSet.allFiles ?? []).map(file => ({
    path: file.path,
    status: file.changes?.join(',') || 'blocked',
  }));
  return {
    ...changedSet,
    allFiles,
    files: allFiles.slice(0, maxFiles),
    truncated: allFiles.length > maxFiles,
    authority: {
      profile: 'raw-head-index-worktree-v1',
      authoritative: true,
      issueCount: changedSet.issues?.length ?? 0,
    },
    ...(changedSet.ok ? {} : { error: '权威变更集不可用' }),
  };
};

export const buildJsonutilsValidationPlanFromWorktree = (worktree) => {
  const validationFiles = worktree.allFiles ?? worktree.files ?? [];
  const matchedRules = worktree.ok ? matchJsonutilsValidationRules(validationFiles) : [];
  const matchedFiles = collectClassifiedValidationPaths(validationFiles);
  const unclassified = sampled(validationFiles.map(file => file.path).filter(file => !matchedFiles.has(file)));
  const changedFileCount = worktree.changedFileCount ?? 0, truncated = Boolean(worktree.truncated);
  const hasCollapsedUntrackedDirectory = validationFiles.some(file => file.status === '??' && file.path.endsWith('/'));
  const hasCompleteFileSet = Array.isArray(worktree.allFiles) && worktree.allFiles.length === changedFileCount && !hasCollapsedUntrackedDirectory;
  const coverageScope = hasCompleteFileSet ? 'all' : 'sample';
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-validation-plan',
    ok: worktree.ok,
    authority: worktree.authority ?? {
      profile: 'caller-provided-component-v1',
      authoritative: false,
      issueCount: 0,
    },
    changedFileCount,
    truncated,
    coverage: { sampledFileCount: worktree.files?.length ?? 0, totalChangedFileCount: changedFileCount, truncated, commandMatchScope: coverageScope, unclassifiedFilesScope: coverageScope },
    commands: uniqueValidationCommands(matchedRules),
    manualChecks: uniqueValidationManualChecks(matchedRules),
    matchedRules: matchedRules.map(({ name, files, matchedFileCount, truncated }) => ({ name, files, matchedFileCount, truncated })),
    unclassifiedFiles: worktree.ok ? unclassified.items : [],
    ...(worktree.ok ? { unclassifiedFileCount: unclassified.count, unclassifiedFilesTruncated: unclassified.truncated } : {}),
    ...(worktree.ok ? {} : { error: worktree.error }),
  };
};

export const buildJsonutilsValidationPlan = async ({
  maxFiles = 50,
  rootDir = process.cwd(),
  runStatus,
  collectChangedSet = collectAuthoritativeValidationChangedSet,
} = {}) => {
  const worktree = runStatus
    ? {
      ...await buildJsonutilsWorktreeSnapshot({ maxFiles, includeAllFiles: true, runStatus }),
      authority: { profile: 'status-fixture-v1', authoritative: false, issueCount: 0 },
    }
    : adaptAuthoritativeChangedSet(await collectChangedSet(rootDir), maxFiles);
  return buildJsonutilsValidationPlanFromWorktree(worktree);
};
