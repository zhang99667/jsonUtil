#!/usr/bin/env node
// 诊断模式不执行插件 lifecycle mutation；仅显式 apply/write-lock 执行受控写入。

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveCodexBinary,
  runProjectPluginLifecycle,
  writeProjectPluginLockLifecycle,
} from './aiGovernanceProjectPluginLifecycle.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const usage = [
  'Usage: node scripts/ci/manage-project-plugins.mjs [--check|--apply|--write-lock]',
  '',
  '  --check       诊断 marketplace、安装、启用和版本状态，不执行 lifecycle mutation（默认）',
  '  --apply       显式注册 marketplace 并对齐未禁用的项目插件',
  '  --write-lock  在插件 manifest 升版后更新项目 content lock',
  '  --help        显示帮助',
].join('\n');
const helpRequested = args.length === 1 && args[0] === '--help';
const selected = args.length === 0 ? 'check' : args.length === 1 && ['--check', '--apply', '--write-lock'].includes(args[0])
  ? args[0].slice(2)
  : 'invalid';

let result;
if (helpRequested) process.stdout.write(`${usage}\n`);
else if (selected === 'write-lock') result = await writeProjectPluginLockLifecycle({ rootDir });
else if (selected === 'check' || selected === 'apply') {
  result = await runProjectPluginLifecycle({
    rootDir,
    mode: selected,
    codexBinary: resolveCodexBinary(process.env),
  });
} else process.stderr.write(`${usage}\nError: LIFECYCLE_ARGUMENTS_INVALID\n`);

if (result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
} else if (!helpRequested) process.exitCode = 2;
