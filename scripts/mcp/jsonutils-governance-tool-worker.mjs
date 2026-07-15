#!/usr/bin/env node
// 每次请求只加载一次当前工具实现；失败不向 stdout/stderr 回显内部细节。

import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

import {
  assertJsonutilsGovernanceRuntimeSourceState,
  captureJsonutilsGovernanceRuntimeSourceState,
} from './jsonutils-governance-runtime-freshness.mjs';
import {
  parseJsonutilsGovernanceToolWorkerRequest,
  serializeJsonutilsGovernanceToolWorkerResult,
} from './jsonutils-governance-tool-worker-contract.mjs';

const workerFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(workerFile), '../..');
const runtimeFile = path.join(rootDir, 'scripts/mcp/jsonutils-governance-tool-runtime.mjs');
const entryFiles = [workerFile, runtimeFile];

const main = async () => {
  if (process.argv.length !== 3) throw new Error('invalid worker request');
  const request = parseJsonutilsGovernanceToolWorkerRequest(process.argv[2]);
  const baseline = captureJsonutilsGovernanceRuntimeSourceState({ rootDir, entryFiles });
  const { executeJsonutilsGovernanceToolRuntime } = await import(pathToFileURL(runtimeFile).href);
  assertJsonutilsGovernanceRuntimeSourceState(
    baseline,
    captureJsonutilsGovernanceRuntimeSourceState({ rootDir, entryFiles }),
  );
  const result = await executeJsonutilsGovernanceToolRuntime(request.name, request.args);
  assertJsonutilsGovernanceRuntimeSourceState(
    baseline,
    captureJsonutilsGovernanceRuntimeSourceState({ rootDir, entryFiles }),
  );
  process.stdout.write(serializeJsonutilsGovernanceToolWorkerResult(result));
};

await main().catch(() => { process.exitCode = 1; });
