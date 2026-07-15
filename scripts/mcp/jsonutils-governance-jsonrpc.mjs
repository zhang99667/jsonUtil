// 统一维护 JSON-RPC 请求边界与标准错误载荷。

const isRequestObject = message => message !== null
  && typeof message === 'object'
  && !Array.isArray(message);
const isSafeRequestId = id => id === null
  || typeof id === 'string'
  || (typeof id === 'number' && Number.isFinite(id));
const hasStructuredParams = message => !Object.hasOwn(message, 'params')
  || (message.params !== null && typeof message.params === 'object');

export class JsonRpcInvalidParamsError extends Error {
  constructor() {
    super('Invalid params');
    this.name = 'JsonRpcInvalidParamsError';
  }
}

const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasString = (value, key) => typeof value?.[key] === 'string' && value[key].length > 0;

export const assertJsonutilsGovernanceMethodParams = (method, params) => {
  const invalid = () => { throw new JsonRpcInvalidParamsError(); };
  if (method === 'initialize' && (
    !isRecord(params) || !hasString(params, 'protocolVersion')
    || !isRecord(params.capabilities) || !isRecord(params.clientInfo)
    || !hasString(params.clientInfo, 'name') || !hasString(params.clientInfo, 'version')
  )) invalid();
  if (method === 'resources/read' && (!isRecord(params) || !hasString(params, 'uri'))) invalid();
  if (method === 'tools/call' && !isRecord(params)) invalid();
  if (['ping', 'resources/list', 'tools/list'].includes(method) && params !== undefined && !isRecord(params)) invalid();
};

export const inspectJsonRpcRequest = (message) => {
  const requestObject = isRequestObject(message);
  const hasId = requestObject && Object.hasOwn(message, 'id');
  const safeId = hasId && isSafeRequestId(message.id) ? message.id : null;
  return {
    id: safeId,
    isNotification: requestObject && !hasId,
    valid: requestObject
      && message.jsonrpc === '2.0'
      && typeof message.method === 'string'
      && hasStructuredParams(message)
      && (!hasId || isSafeRequestId(message.id)),
  };
};

const errorResponse = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

export const jsonRpcParseError = () => errorResponse(null, -32700, 'Parse error');
export const jsonRpcInvalidRequest = message => errorResponse(inspectJsonRpcRequest(message).id, -32600, 'Invalid Request');
export const jsonRpcInvalidParams = id => errorResponse(id, -32602, 'Invalid params');
export const jsonRpcInternalError = id => errorResponse(id, -32603, 'Internal error');
