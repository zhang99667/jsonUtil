import { createHash } from 'node:crypto';

import {
  CODEX_EXEC_TRACE_ADAPTER,
  createCodexExecJsonlProjector,
} from './aiGovernanceCodexExecTraceProjection.mjs';

export { CODEX_EXEC_TRACE_ADAPTER };

const MAX_CAPTURE_BYTES = 16 * 1024 * 1024;
const asChunk = (value) => {
  if (typeof value === 'string' || Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  throw new TypeError('jsonlChunks 只能包含 string、Buffer 或 Uint8Array');
};
const assertReportedExecution = (execution) => {
  if (!execution || typeof execution !== 'object' || Array.isArray(execution)
    || !Number.isInteger(execution.exitCode)
    || typeof execution.stdoutDrained !== 'boolean'
    || typeof execution.timedOut !== 'boolean'
    || typeof execution.binaryStable !== 'boolean'
    || execution.outputLimitExceeded !== undefined && typeof execution.outputLimitExceeded !== 'boolean') {
    throw new TypeError('reportedExecution 必须显式提供外部报告的闭合执行事实');
  }
  return execution;
};

export const projectCodexExecJsonlTrace = ({
  cliVersion,
  jsonlChunks,
  reportedExecution,
  projectorOptions,
}) => {
  if (typeof cliVersion !== 'string' || cliVersion.length === 0 || cliVersion.length > 64) {
    throw new TypeError('cliVersion 必须是非空安全版本标识');
  }
  if (!Array.isArray(jsonlChunks) || jsonlChunks.length === 0) {
    throw new TypeError('jsonlChunks 必须是非空数组');
  }
  const execution = assertReportedExecution(reportedExecution);
  const projector = createCodexExecJsonlProjector(cliVersion, projectorOptions);
  const stdoutHash = createHash('sha256');
  let acceptedBytes = 0;
  let outputLimitExceeded = execution.outputLimitExceeded === true;
  for (const value of jsonlChunks) {
    const chunk = asChunk(value);
    stdoutHash.update(chunk);
    const remaining = Math.max(0, MAX_CAPTURE_BYTES - acceptedBytes);
    if (chunk.length > remaining) outputLimitExceeded = true;
    if (remaining > 0) {
      const accepted = chunk.subarray(0, remaining);
      projector.push(accepted);
      acceptedBytes += accepted.length;
    }
  }
  const projected = projector.finalize({ ...execution, outputLimitExceeded });
  return {
    ...projected,
    executionFacts: {
      origin: 'externally-reported-unverified',
      cliVersion,
      stdoutSha256: stdoutHash.digest('hex'),
      exitCode: execution.exitCode,
      stdoutDrained: execution.stdoutDrained,
      timedOut: execution.timedOut,
      binaryStable: execution.binaryStable,
      outputLimitExceeded,
    },
  };
};
