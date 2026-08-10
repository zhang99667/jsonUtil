// 单源维护 JSONUtils 治理 MCP 方法参数契约。

export class JsonRpcInvalidParamsError extends Error {
  constructor() {
    super('Invalid params');
    this.name = 'JsonRpcInvalidParamsError';
  }
}

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasString = (value, key) => typeof value?.[key] === 'string' && value[key].length > 0;
const isCancellationRequestId = value => typeof value === 'string'
  || (typeof value === 'number' && Number.isFinite(value));

export const assertJsonutilsGovernanceMethodParams = (method, params) => {
  const invalid = () => { throw new JsonRpcInvalidParamsError(); };
  if (method === 'initialize' && (
    !isRecord(params) || !hasString(params, 'protocolVersion')
    || !isRecord(params.capabilities) || !isRecord(params.clientInfo)
    || !hasString(params.clientInfo, 'name') || !hasString(params.clientInfo, 'version')
  )) invalid();
  if (method === 'resources/read' && (!isRecord(params) || !hasString(params, 'uri'))) invalid();
  if (method === 'tools/call' && !isRecord(params)) invalid();
  if (method === 'notifications/initialized' && params !== undefined && !isRecord(params)) invalid();
  if (method === 'notifications/cancelled' && (
    !isRecord(params)
    || !isCancellationRequestId(params.requestId)
    || (Object.hasOwn(params, 'reason') && typeof params.reason !== 'string')
    || Object.keys(params).some(field => !['requestId', 'reason'].includes(field))
  )) invalid();
  if (['ping', 'resources/list', 'tools/list'].includes(method) && params !== undefined && !isRecord(params)) invalid();
};
