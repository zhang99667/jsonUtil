import { createHash } from 'node:crypto';

import { readStableSnapshotFile } from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';

export const REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT = Object.freeze({
  id: 'mcp-registration-canary-snapshot-preflight',
  version: '1.1.0',
});
export const REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES = 16 * 1024;

const MCP_CONFIG_ERROR = 'snapshot preflight 只接受仓内固定 keyless stdio MCP 配置';
const isPlainRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasExactFields = (value, fields) => isPlainRecord(value)
  && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...fields].sort());
const stableValue = value => Array.isArray(value) ? value.map(stableValue)
  : isPlainRecord(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;

export const hashRegistrationCanarySnapshotValue = (domain, value) => createHash('sha256')
  .update(JSON.stringify({ domain, value })).digest('hex');

export const registrationCanarySnapshotValuesEqual = (left, right) => JSON.stringify(stableValue(left))
  === JSON.stringify(stableValue(right));

export const readRegistrationCanarySnapshotMcpConfig = (snapshotRoot) => {
  let config;
  try {
    config = JSON.parse(readStableSnapshotFile(snapshotRoot, '.mcp.json', 1024 * 1024).bytes.toString('utf8'));
  } catch {
    throw new Error(MCP_CONFIG_ERROR);
  }
  const servers = isPlainRecord(config) ? config.mcpServers : undefined;
  const server = servers?.['jsonutils-governance'];
  if (!hasExactFields(config, ['mcpServers'])
    || !hasExactFields(servers, ['jsonutils-governance'])
    || !hasExactFields(server, ['command', 'args'])
    || server.command !== 'node'
    || JSON.stringify(server.args) !== JSON.stringify(['scripts/mcp/jsonutils-governance-server.mjs'])) {
    throw new Error(MCP_CONFIG_ERROR);
  }
  return Object.freeze({ command: server.command, args: Object.freeze([...server.args]) });
};

export const assertRegistrationCanarySnapshotJsonRpcResult = (response, label) => {
  if (!isPlainRecord(response) || Object.hasOwn(response, 'error') || !Object.hasOwn(response, 'result')) {
    throw new Error(`${label} 返回 JSON-RPC error`);
  }
  return response.result;
};

export const projectRegistrationCanarySnapshotScorecard = (called) => {
  if (typeof called?.isError !== 'boolean' || !Array.isArray(called.content) || called.content.length !== 1
    || called.content[0]?.type !== 'text') throw new Error('snapshot scorecard 返回错误或非闭合 text result');
  let scorecard;
  try { scorecard = JSON.parse(called.content[0].text); } catch { throw new Error('snapshot scorecard text 不是合法 JSON'); }
  if (!isPlainRecord(called.structuredContent)
    || !registrationCanarySnapshotValuesEqual(called.structuredContent, scorecard)) {
    throw new Error('snapshot scorecard text 与 structuredContent 不一致');
  }
  const nextFocusId = scorecard.maturityScorecard?.nextFocus?.id;
  if (!isPlainRecord(scorecard) || scorecard.reportType !== 'jsonutils-governance-scorecard'
    || typeof scorecard.ok !== 'boolean' || called.isError !== !scorecard.ok
    || scorecard.maturityScorecard?.reportType !== 'ai-governance-maturity-scorecard'
    || typeof nextFocusId !== 'string' || nextFocusId.length < 1 || nextFocusId.length > 128) {
    throw new Error('snapshot scorecard 状态或结果契约漂移');
  }
  return Object.freeze({
    scorecardOk: scorecard.ok,
    isError: called.isError,
    reportType: scorecard.reportType,
    maturityReportType: scorecard.maturityScorecard.reportType,
    nextFocusIdSha256: hashRegistrationCanarySnapshotValue(
      'jsonutils.registration-snapshot.next-focus/v1', nextFocusId,
    ),
    resultSha256: hashRegistrationCanarySnapshotValue(
      'jsonutils.registration-snapshot.scorecard-result/v1', scorecard,
    ),
  });
};

export const createRegistrationCanarySnapshotStderrObserver = ({
  maxBytes = REGISTRATION_CANARY_SNAPSHOT_STDERR_MAX_BYTES,
  onLimitExceeded = () => {},
} = {}) => {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes >= Number.MAX_SAFE_INTEGER
    || typeof onLimitExceeded !== 'function') {
    throw new TypeError('snapshot MCP stderr observer 参数非法');
  }
  let byteCount = 0;
  let limitExceeded = false;
  return Object.freeze({
    observe(chunk) {
      if (limitExceeded) return;
      const chunkBytes = Buffer.isBuffer(chunk) ? chunk.length
        : typeof chunk === 'string' ? Buffer.byteLength(chunk) : null;
      if (chunkBytes === null) throw new TypeError('snapshot MCP stderr chunk 类型非法');
      const nextByteCount = byteCount + chunkBytes;
      byteCount = Math.min(nextByteCount, maxBytes + 1);
      if (nextByteCount > maxBytes) {
        limitExceeded = true;
        onLimitExceeded();
      }
    },
    result() {
      if (limitExceeded) throw new Error('snapshot MCP stderr 超出固定上限');
      return Object.freeze({ byteCount, nonEmpty: byteCount > 0 });
    },
  });
};
