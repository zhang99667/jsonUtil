import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  JsonutilsGovernanceRuntimeStaleError,
  captureJsonutilsGovernanceRuntimeSourceState,
  createJsonutilsGovernanceRuntimeFreshnessGuard,
} from './jsonutils-governance-runtime-freshness.mjs';
import { handleJsonutilsGovernanceRequest } from './jsonutils-governance-server.mjs';
import { registerJsonutilsGovernanceToolWorkerFreshnessTestCases } from './jsonutilsGovernanceToolWorkerFreshnessTestCases.mjs';

const createTempRoot = (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-mcp-freshness-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  return rootDir;
};
const projectRoot = path.resolve(import.meta.dirname, '../..');
test('controller fingerprint fails closed after a transitive source changes', (t) => {
  const rootDir = createTempRoot(t);
  const entryFile = path.join(rootDir, 'controller.mjs');
  const dependencyFile = path.join(rootDir, 'dependency.mjs');
  fs.writeFileSync(entryFile, "import './dependency.mjs';\n");
  fs.writeFileSync(dependencyFile, "export const version = 'v1';\n");
  const guard = createJsonutilsGovernanceRuntimeFreshnessGuard({ rootDir, entryFile });

  guard.assertFresh();
  fs.writeFileSync(dependencyFile, "export const version = 'v2';\n");
  assert.throws(() => guard.assertFresh(), (error) => {
    assert.ok(error instanceof JsonutilsGovernanceRuntimeStaleError);
    assert.equal(error.reasonCode, 'runtime-source-changed');
    assert.doesNotMatch(error.message, /dependency|v2|[a-f0-9]{64}/i);
    return true;
  });
});

test('long-lived controller import closure excludes the tool implementation data plane', () => {
  const state = captureJsonutilsGovernanceRuntimeSourceState({
    rootDir: projectRoot,
    entryFiles: [path.join(projectRoot, 'scripts/mcp/jsonutils-governance-server.mjs')],
  });
  assert.ok(state.files.includes('scripts/mcp/jsonutils-governance-tools.mjs'));
  assert.ok(state.files.includes('scripts/mcp/jsonutils-governance-tool-worker-client.mjs'));
  assert.equal(state.files.includes('scripts/mcp/jsonutils-governance-tool-runtime.mjs'), false);
  assert.equal(state.files.includes('scripts/mcp/jsonutils-governance-evaluations.mjs'), false);
});

test('runtime fingerprint rejects a local import that escapes its declared root', (t) => {
  const container = createTempRoot(t);
  const rootDir = path.join(container, 'root');
  fs.mkdirSync(rootDir);
  fs.writeFileSync(path.join(container, 'outside.mjs'), 'export const outside = true;\n');
  fs.writeFileSync(path.join(rootDir, 'entry.mjs'), "import '../outside.mjs';\n");
  assert.throws(
    () => createJsonutilsGovernanceRuntimeFreshnessGuard({ rootDir, entryFile: path.join(rootDir, 'entry.mjs') }),
    error => error instanceof JsonutilsGovernanceRuntimeStaleError,
  );
});

test('stale controller returns a fixed restart-required tool result without executing work', async (t) => {
  const rootDir = createTempRoot(t);
  const entryFile = path.join(rootDir, 'controller.mjs');
  fs.writeFileSync(entryFile, 'export const version = 1;\n');
  const guard = createJsonutilsGovernanceRuntimeFreshnessGuard({ rootDir, entryFile });
  fs.writeFileSync(entryFile, 'export const version = 2;\n');
  let workerCalled = false;

  const response = await handleJsonutilsGovernanceRequest({
    jsonrpc: '2.0', id: 7, method: 'tools/call',
    params: { name: 'ai_evaluation_summary', arguments: { limit: 3 } },
  }, {
    runtimeFreshnessGuard: guard,
    runToolWorker: async () => { workerCalled = true; },
  });

  assert.equal(workerCalled, false);
  assert.equal(response.result.isError, true);
  assert.deepEqual(response.result.structuredContent, {
    schemaVersion: 1,
    reportType: 'jsonutils-governance-runtime-freshness',
    ok: false,
    reasonCode: 'runtime-source-changed',
    action: 'restart-mcp-server',
  });
  assert.deepEqual(JSON.parse(response.result.content[0].text), response.result.structuredContent);
});

registerJsonutilsGovernanceToolWorkerFreshnessTestCases();
