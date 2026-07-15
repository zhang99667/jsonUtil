import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  initializeGovernanceMcpServer,
  startGovernanceMcpServer,
} from '../ci/jsonutilsGovernanceMcpStdioTestClient.mjs';
import { request, serializeMessage } from '../ci/mcpLineDelimitedStdioClient.mjs';

const governanceReportRequest = id => ({
  jsonrpc: '2.0', id, method: 'tools/call',
  params: { name: 'ai_governance_report', arguments: { top: 35 } },
});
const evaluationSummaryRequest = id => ({
  jsonrpc: '2.0', id, method: 'tools/call',
  params: { name: 'ai_evaluation_summary', arguments: { limit: 50 } },
});

test('real stdio cancellation preempts a long tool, emits no cancelled response and recovers', async (t) => {
  const { child, readMessage, getStdout } = startGovernanceMcpServer(t);
  await initializeGovernanceMcpServer(child, readMessage, 'cancellation-stdio-test');
  child.stdin.write([
    serializeMessage(evaluationSummaryRequest(41)),
    serializeMessage({
      jsonrpc: '2.0', method: 'notifications/cancelled',
      params: { requestId: 41, reason: 'private-cancellation-reason' },
    }),
    serializeMessage({ jsonrpc: '2.0', id: 42, method: 'ping' }),
  ].join(''));

  assert.deepEqual(await readMessage(2000), { jsonrpc: '2.0', id: 42, result: {} });
  await assert.rejects(readMessage(400), /Timed out waiting for MCP response/);
  assert.doesNotMatch(getStdout(), /"id":41|private-cancellation-reason/);
  assert.deepEqual((await request(child, readMessage, 43, 'ping')).result, {});

  child.stdin.write([
    serializeMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 999 } }),
    serializeMessage({ jsonrpc: '2.0', method: 'notifications/cancelled', params: {} }),
    serializeMessage({ jsonrpc: '2.0', id: 44, method: 'ping' }),
  ].join(''));
  assert.equal((await readMessage()).id, 44);
  await assert.rejects(readMessage(200), /Timed out waiting for MCP response/);
});

test('closing stdin aborts in-flight tool work and lets the real server exit promptly', async (t) => {
  const { child, readMessage, getStdout } = startGovernanceMcpServer(t);
  await initializeGovernanceMcpServer(child, readMessage, 'cancellation-close-test');
  const stdoutBefore = getStdout();
  const exited = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('MCP server did not exit after stdin close')), 2500);
    child.once('exit', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal });
    });
  });
  child.stdin.write(serializeMessage(governanceReportRequest(51)));
  child.stdin.end();

  assert.deepEqual(await exited, { code: 0, signal: null });
  assert.equal(getStdout(), stdoutBefore);
});
