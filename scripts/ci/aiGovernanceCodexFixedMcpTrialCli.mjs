import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { preflightCodexFixedMcpTrial } from './aiGovernanceCodexFixedMcpTrialPreflight.mjs';

export const CODEX_FIXED_MCP_TRIAL_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), '../..',
);
const VALUE_OPTIONS = Object.freeze(['--binary', '--expected-binary-sha256', '--model']);

export const parseCodexFixedMcpTrialCliArgs = (argv) => {
  if (!Array.isArray(argv) || argv[0] !== 'preflight') {
    throw new TypeError('仓库 CLI 只允许无密钥 preflight；真实 run 必须由仓外受保护 host 执行');
  }
  const values = {};
  for (let index = 1; index < argv.length; index += 2) {
    const option = argv[index], value = argv[index + 1];
    if (!VALUE_OPTIONS.includes(option)) throw new TypeError(`不支持的参数: ${option}`);
    if (Object.hasOwn(values, option)) throw new TypeError('参数不能重复');
    if (typeof value !== 'string' || value.startsWith('--')) throw new TypeError(`${option} 缺少值`);
    values[option] = value;
  }
  for (const option of VALUE_OPTIONS) if (!values[option]) throw new TypeError(`缺少必需参数 ${option}`);
  return {
    command: 'preflight',
    binaryPath: values['--binary'],
    expectedBinarySha256: values['--expected-binary-sha256'],
    modelId: values['--model'],
  };
};

const assertComponentOnlyReport = (report) => {
  if (report?.evidenceScope !== 'component-only'
    || report?.outcomeEligible !== false
    || report?.confirmedCoverageEligible !== false
    || report?.automaticLedgerWrites !== false
    || report?.toolManifestCoverage !== 'not-captured') {
    throw new Error('preflight 未保持 component-only 边界');
  }
};

export const runCodexFixedMcpTrialCli = async ({
  argv, stdout = process.stdout, preflight = preflightCodexFixedMcpTrial,
}) => {
  const options = parseCodexFixedMcpTrialCliArgs(argv);
  const report = await preflight({
    rootDir: CODEX_FIXED_MCP_TRIAL_ROOT,
    binaryPath: options.binaryPath,
    expectedBinarySha256: options.expectedBinarySha256,
    modelId: options.modelId,
  });
  assertComponentOnlyReport(report);
  stdout.write(`${JSON.stringify(report)}\n`);
  return { exitCode: report.ok ? 0 : 2 };
};
