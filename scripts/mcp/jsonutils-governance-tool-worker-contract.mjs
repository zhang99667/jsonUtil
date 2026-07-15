// 单源维护治理工具 worker 的闭字段请求、响应与尺寸边界。

export const MAX_TOOL_WORKER_REQUEST_BYTES = 4096;
export const MAX_TOOL_WORKER_OUTPUT_BYTES = 768 * 1024;
export const MAX_TOOL_WORKER_STDERR_BYTES = 16 * 1024;
export const TOOL_WORKER_TIMEOUT_MS = 30_000;

export class JsonutilsGovernanceToolWorkerContractError extends Error {
  constructor() {
    super('Governance tool worker contract failed');
    this.name = 'JsonutilsGovernanceToolWorkerContractError';
  }
}

const failContract = () => { throw new JsonutilsGovernanceToolWorkerContractError(); };
const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasExactKeys = (value, keys) => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

const assertToolResult = (result) => {
  if (!isPlainObject(result)) failContract();
  const keys = Object.hasOwn(result, 'structuredContent')
    ? ['content', 'structuredContent', 'isError']
    : ['content', 'isError'];
  if (!hasExactKeys(result, keys) || typeof result.isError !== 'boolean') failContract();
  if (!Array.isArray(result.content) || result.content.length !== 1) failContract();
  const content = result.content[0];
  if (!isPlainObject(content) || !hasExactKeys(content, ['type', 'text'])
    || content.type !== 'text' || typeof content.text !== 'string') failContract();
  if (Object.hasOwn(result, 'structuredContent') && !isPlainObject(result.structuredContent)) failContract();
  return result;
};

export const encodeJsonutilsGovernanceToolWorkerRequest = (request) => {
  if (!isPlainObject(request) || !hasExactKeys(request, ['name', 'args'])
    || typeof request.name !== 'string' || request.name.length === 0 || !isPlainObject(request.args)) failContract();
  const bytes = Buffer.from(JSON.stringify(request));
  if (bytes.length > MAX_TOOL_WORKER_REQUEST_BYTES) failContract();
  return bytes.toString('base64url');
};

export const parseJsonutilsGovernanceToolWorkerRequest = (encoded) => {
  if (typeof encoded !== 'string' || encoded.length === 0 || !/^[A-Za-z0-9_-]+$/.test(encoded)) failContract();
  const bytes = Buffer.from(encoded, 'base64url');
  if (bytes.length > MAX_TOOL_WORKER_REQUEST_BYTES || bytes.toString('base64url') !== encoded) failContract();
  let request;
  try { request = JSON.parse(bytes.toString('utf8')); } catch { failContract(); }
  if (JSON.stringify(request) !== bytes.toString('utf8')) failContract();
  encodeJsonutilsGovernanceToolWorkerRequest(request);
  return request;
};

export const serializeJsonutilsGovernanceToolWorkerResult = (result) => {
  const output = `${JSON.stringify({ schemaVersion: 1, result: assertToolResult(result) })}\n`;
  if (Buffer.byteLength(output) > MAX_TOOL_WORKER_OUTPUT_BYTES) failContract();
  return output;
};

export const parseJsonutilsGovernanceToolWorkerResult = (output) => {
  const bytes = Buffer.isBuffer(output) ? output : Buffer.from(output);
  if (bytes.length === 0 || bytes.length > MAX_TOOL_WORKER_OUTPUT_BYTES) failContract();
  const text = bytes.toString('utf8');
  if (!text.endsWith('\n') || text.indexOf('\n') !== text.length - 1) failContract();
  let envelope;
  try { envelope = JSON.parse(text.slice(0, -1)); } catch { failContract(); }
  if (!isPlainObject(envelope) || !hasExactKeys(envelope, ['schemaVersion', 'result'])
    || envelope.schemaVersion !== 1 || `${JSON.stringify(envelope)}\n` !== text) failContract();
  return assertToolResult(envelope.result);
};
