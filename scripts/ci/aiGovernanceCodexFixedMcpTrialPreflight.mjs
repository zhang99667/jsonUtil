import { lstat, realpath } from 'node:fs/promises';

import {
  buildCodexFixedMcpTrialProfile,
  buildCodexFixedMcpPreflightEnvironment,
  CODEX_FIXED_MCP_TRIAL_RUNNER,
  isSupportedCodexFixedMcpCliVersion,
  withCodexFixedMcpIsolation,
} from './aiGovernanceCodexFixedMcpTrialProfile.mjs';
import { hashCodexExecFile, readCodexCliVersion } from './aiGovernanceCodexExecCaptureRuntime.mjs';

export const CODEX_FIXED_MCP_COMPONENT_ONLY_BOUNDARY = Object.freeze({
  evidenceScope: 'component-only',
  outcomeEligible: false,
  confirmedCoverageEligible: false,
  toolManifestCoverage: 'not-captured',
  automaticLedgerWrites: false,
});

export const buildCodexFixedMcpBinaryBinding = profile => ({
  expectedSha256: profile.expectedBinarySha256,
  observedSha256: profile.binarySha256,
});

export const preflightCodexFixedMcpTrial = async ({
  rootDir, binaryPath, expectedBinarySha256, modelId,
}) => withCodexFixedMcpIsolation(async (isolation) => {
  const profile = await buildCodexFixedMcpTrialProfile({
    rootDir, binaryPath, expectedBinarySha256, isolation, modelId,
  });
  const cliVersion = await readCodexCliVersion(
    profile.binaryPath,
    profile.cwd,
    buildCodexFixedMcpPreflightEnvironment(profile),
  );
  const [metadata, resolvedBinary, binarySha256] = await Promise.all([
    lstat(profile.binaryPath),
    realpath(profile.binaryPath),
    hashCodexExecFile(profile.binaryPath),
  ]);
  if (metadata.isSymbolicLink() || !metadata.isFile()
    || resolvedBinary !== profile.binaryPath || binarySha256 !== profile.expectedBinarySha256) {
    throw new Error('Codex CLI binary 在 keyless version preflight 期间发生变化');
  }
  if (!isSupportedCodexFixedMcpCliVersion(cliVersion)) {
    throw new Error('固定 runner 不支持当前 Codex CLI 版本');
  }
  return {
    schemaVersion: 1,
    reportType: 'codex-fixed-mcp-trial-preflight',
    ok: true,
    ...CODEX_FIXED_MCP_COMPONENT_ONLY_BOUNDARY,
    runner: CODEX_FIXED_MCP_TRIAL_RUNNER,
    modelId: profile.modelId,
    cliVersion,
    binaryBinding: buildCodexFixedMcpBinaryBinding(profile),
  };
});
