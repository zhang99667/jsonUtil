// 统一维护通用 JSON-RPC 请求 envelope 与标准错误载荷。

const isRequestObject = message => message !== null
  && typeof message === 'object'
  && !Array.isArray(message);
const isSafeRequestId = id => id === null
  || typeof id === 'string'
  || (typeof id === 'number' && Number.isFinite(id));
const hasStructuredParams = message => !Object.hasOwn(message, 'params')
  || (message.params !== null && typeof message.params === 'object');

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
export const jsonRpcServerNotInitialized = id => errorResponse(id, -32002, 'Server not initialized');
