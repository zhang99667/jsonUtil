import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, realpath, rm, stat, lstat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { hashCodexExecFile } from './aiGovernanceCodexExecCaptureRuntime.mjs';

export const CODEX_FIXED_MCP_TRIAL_RUNNER = Object.freeze({
  id: 'codex-fixed-mcp-trial', version: '1.3.0', caseId: 'mcp-fixed-tool-selection',
});
export const CODEX_FIXED_MCP_RESULT_PATHS = Object.freeze({
  'jsonutils-governance/ai_governance_scorecard': Object.freeze(['maturityScorecard.nextFocus.id']),
});
export const CODEX_FIXED_MCP_COMPONENT_CONSTRAINTS = Object.freeze({
  evidenceScope: 'component-only',
  executable: false,
  requiredMcp: 'jsonutils-governance/ai_governance_scorecard',
  requiredResultPaths: CODEX_FIXED_MCP_RESULT_PATHS['jsonutils-governance/ai_governance_scorecard'],
  forbiddenCapabilities: Object.freeze(['shell', 'file-write', 'web', 'apps', 'multi-agent']),
  credentialBoundary: 'external-controller-and-isolated-mcp-required',
});

const MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SUPPORTED_CLI_VERSIONS = new Set(['0.144.0-alpha.4']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
};
const resolvePlainFile = async (filePath, label) => {
  if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) throw new TypeError(`${label} 必须是绝对路径`);
  if ((await lstat(filePath)).isSymbolicLink()) throw new TypeError(`${label} 不能是 symlink`);
  const resolved = await realpath(filePath);
  if (!(await stat(resolved)).isFile()) throw new TypeError(`${label} 必须是普通文件`);
  return resolved;
};
const resolvePrivateDirectory = async (directory, label) => {
  if (typeof directory !== 'string' || !path.isAbsolute(directory)) throw new TypeError(`${label} 必须是绝对路径`);
  if ((await lstat(directory)).isSymbolicLink()) throw new TypeError(`${label} 不能是 symlink`);
  const resolved = await realpath(directory);
  const metadata = await stat(resolved);
  if (!metadata.isDirectory()) throw new TypeError(`${label} 必须是目录`);
  if ((metadata.mode & 0o077) !== 0) throw new TypeError(`${label} 权限必须限制为 0700`);
  return resolved;
};

export const isSupportedCodexFixedMcpCliVersion = version => SUPPORTED_CLI_VERSIONS.has(version);

export const withCodexFixedMcpIsolation = async (run) => {
  if (typeof run !== 'function') throw new TypeError('run 必须是函数');
  const isolationRoot = await mkdtemp(path.join(os.tmpdir(), 'jsonutils-codex-fixed-mcp-'));
  await chmod(isolationRoot, 0o700);
  const isolation = Object.fromEntries([
    ['home', 'home'], ['codexHome', 'codex-home'], ['cwd', 'workspace'], ['tmpDir', 'tmp'],
  ].map(([key, directory]) => [key, path.join(isolationRoot, directory)]));
  try {
    await Promise.all(Object.values(isolation).map(directory => mkdir(directory, { mode: 0o700 })));
    return await run(isolation);
  } finally {
    await rm(isolationRoot, { recursive: true, force: true });
  }
};

export const assertCodexFixedMcpTrialProfile = (profile) => {
  if (profile?.id !== CODEX_FIXED_MCP_TRIAL_RUNNER.id
    || profile?.version !== CODEX_FIXED_MCP_TRIAL_RUNNER.version
    || profile?.caseId !== CODEX_FIXED_MCP_TRIAL_RUNNER.caseId
    || !SHA256_PATTERN.test(profile?.expectedBinarySha256 ?? '')
    || profile?.binarySha256 !== profile.expectedBinarySha256
    || !SHA256_PATTERN.test(profile?.componentDescriptorSha256 ?? '')
    || profile?.componentConstraints !== CODEX_FIXED_MCP_COMPONENT_CONSTRAINTS
    || profile?.projectorOptions?.mcpResultKeyAllowlist !== CODEX_FIXED_MCP_RESULT_PATHS) {
    throw new TypeError('固定 MCP trial profile 契约不匹配');
  }
  return profile;
};

export const buildCodexFixedMcpPreflightEnvironment = profile => ({
  ...(typeof process.env.PATH === 'string' ? { PATH: process.env.PATH } : {}),
  HOME: profile.home, CODEX_HOME: profile.codexHome, TMPDIR: profile.tmpDir, LANG: 'C.UTF-8',
});

export const buildCodexFixedMcpTrialProfile = async ({
  rootDir, binaryPath, expectedBinarySha256, isolation, modelId,
}) => {
  if (typeof rootDir !== 'string' || !path.isAbsolute(rootDir)) throw new TypeError('rootDir 必须是绝对路径');
  if (!SHA256_PATTERN.test(expectedBinarySha256 ?? '')) throw new TypeError('expectedBinarySha256 必须是小写 SHA-256');
  if (!MODEL_PATTERN.test(modelId ?? '')) throw new TypeError('modelId 必须由 host 固定为安全标识符');
  const resolvedRoot = await realpath(rootDir);
  if (!(await stat(resolvedRoot)).isDirectory()) throw new TypeError('rootDir 必须是目录');
  const [codexBinary, home, codexHome, cwd, tmpDir] = await Promise.all([
    resolvePlainFile(binaryPath, 'binaryPath'),
    resolvePrivateDirectory(isolation?.home, 'isolation.home'),
    resolvePrivateDirectory(isolation?.codexHome, 'isolation.codexHome'),
    resolvePrivateDirectory(isolation?.cwd, 'isolation.cwd'),
    resolvePrivateDirectory(isolation?.tmpDir, 'isolation.tmpDir'),
  ]);
  for (const [label, directory] of Object.entries({ home, codexHome, cwd, tmpDir })) {
    if (isWithin(resolvedRoot, directory)) throw new TypeError(`isolation.${label} 必须位于待测 worktree 之外`);
  }
  if (isWithin(resolvedRoot, codexBinary)) throw new TypeError('binaryPath 必须位于待测 worktree 之外');
  const binarySha256 = await hashCodexExecFile(codexBinary);
  if (binarySha256 !== expectedBinarySha256) throw new TypeError('Codex CLI binary SHA-256 与 host 绑定不匹配');
  const componentDescriptorSha256 = sha256(JSON.stringify({
    runner: CODEX_FIXED_MCP_TRIAL_RUNNER,
    modelId,
    binarySha256,
    constraints: CODEX_FIXED_MCP_COMPONENT_CONSTRAINTS,
  }));
  return Object.freeze({
    ...CODEX_FIXED_MCP_TRIAL_RUNNER,
    rootDir: resolvedRoot,
    binaryPath: codexBinary,
    expectedBinarySha256,
    binarySha256,
    home,
    codexHome,
    cwd,
    tmpDir,
    modelId,
    componentDescriptorSha256,
    componentConstraints: CODEX_FIXED_MCP_COMPONENT_CONSTRAINTS,
    projectorOptions: Object.freeze({ mcpResultKeyAllowlist: CODEX_FIXED_MCP_RESULT_PATHS }),
  });
};
