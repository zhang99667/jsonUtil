// 单源维护 MCP 初始化状态、请求顺序和标准错误映射。

import {
  assertJsonutilsGovernanceMethodParams,
  inspectJsonRpcRequest,
  jsonRpcInvalidRequest,
  jsonRpcServerNotInitialized,
} from './jsonutils-governance-jsonrpc.mjs';
import { createJsonutilsGovernanceRequestLifecycle } from './jsonutils-governance-cancellation.mjs';

export const createJsonutilsGovernanceMessageHandler = ({ handleRequest, writeMessage }) => {
  let phase = 'new';
  let pending = Promise.resolve();
  const requests = createJsonutilsGovernanceRequestLifecycle({ handleRequest, writeMessage });

  const handle = async (message) => {
    const request = inspectJsonRpcRequest(message);
    if (!request.valid) {
      writeMessage(jsonRpcInvalidRequest(message));
      return;
    }
    try {
      assertJsonutilsGovernanceMethodParams(message.method, message.params);
      if (message.method === 'notifications/cancelled') {
        if (!request.isNotification) writeMessage(jsonRpcInvalidRequest(message));
        else requests.cancel(message.params.requestId);
        return;
      }
      if (message.method === 'initialize') {
        if (request.isNotification || phase !== 'new') {
          if (!request.isNotification) writeMessage(jsonRpcInvalidRequest(message));
          return;
        }
      } else if (message.method === 'notifications/initialized') {
        if (!request.isNotification) writeMessage(jsonRpcInvalidRequest(message));
        else if (phase === 'initialized') phase = 'ready';
        return;
      } else if (phase !== 'ready' && message.method !== 'ping') {
        if (!request.isNotification) writeMessage(jsonRpcServerNotInitialized(request.id));
        return;
      }

      if (request.isNotification) return;
      if (message.method === 'initialize') {
        const response = await handleRequest(message);
        phase = 'initialized';
        writeMessage(response);
        return;
      }
      requests.start(message, request);
    } catch (error) {
      requests.writeError(request, error);
    }
  };

  const handleMessage = (message) => {
    pending = pending.then(() => handle(message));
    return pending;
  };
  handleMessage.close = requests.close;
  return handleMessage;
};
