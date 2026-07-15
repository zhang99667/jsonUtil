#!/usr/bin/env node
// 显式比较本机项目插件缓存与仓库 content lock；匹配仍不等于可信安装或运行时证明。

import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectInstalledProjectPluginFailures } from './aiGovernanceProjectPluginLock.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const usage = [
  'Usage: node scripts/ci/check-project-plugin-installation.mjs',
  '',
  '比较 CODEX_HOME 中的 jsonutils-project 安装副本与项目 content lock。',
  '该 component 检查不证明当前任务注册、runtime trust 或 attestation。',
  '  --help  显示帮助',
].join('\n');

if (args.length === 1 && args[0] === '--help') process.stdout.write(`${usage}\n`);
else if (args.length > 0) {
  process.stderr.write(`${usage}\nError: INSTALLATION_CHECK_ARGUMENTS_INVALID\n`);
  process.exitCode = 2;
} else {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const cacheRoot = path.join(codexHome, 'plugins/cache/jsonutils-project');
  const failures = collectInstalledProjectPluginFailures({ rootDir, cacheRoot });
  const report = {
    schemaVersion: 1,
    reportType: 'jsonutils-project-plugin-installation-check',
    status: failures.length === 0 ? 'installed-copy-matched-unverified' : 'mismatch',
    trustBoundary: 'local-cache-component-only',
    runtimeTrustVerified: false,
    attestationVerified: false,
    failures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}
