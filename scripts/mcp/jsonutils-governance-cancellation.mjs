// 单源管理 MCP in-flight request、取消竞态与连接关闭回收。

import {
  JsonRpcInvalidParamsError,
  jsonRpcInternalError,
  jsonRpcInvalidParams,
  jsonRpcInvalidRequest,
} from './jsonutils-governance-jsonrpc.mjs';
import { JsonutilsGovernanceToolInputError } from './jsonutils-governance-tool-input.mjs';

export const createJsonutilsGovernanceRequestLifecycle = ({ handleRequest, writeMessage }) => {
  const inFlight = new Map();
  let closed = false;

  const writeError = (request, error) => {
    if (request.isNotification) return;
    if (error instanceof JsonRpcInvalidParamsError || error instanceof JsonutilsGovernanceToolInputError) {
      writeMessage(jsonRpcInvalidParams(request.id));
      return;
    }
    writeMessage(jsonRpcInternalError(request.id));
  };
  const abortEntry = (entry) => {
    if (entry.cancelled) return;
    entry.cancelled = true;
    entry.controller.abort();
  };
  const start = (message, request) => {
    if (closed) return;
    if (inFlight.has(request.id)) {
      writeMessage(jsonRpcInvalidRequest(message));
      return;
    }
    const controller = new AbortController();
    const entry = { controller, cancelled: false };
    inFlight.set(request.id, entry);
    Promise.resolve()
      .then(() => handleRequest(message, { signal: controller.signal }))
      .then((response) => {
        if (!entry.cancelled && !controller.signal.aborted) writeMessage(response);
      })
      .catch(error => writeError(
        { ...request, isNotification: entry.cancelled || controller.signal.aborted },
        error,
      ))
      .finally(() => {
        if (inFlight.get(request.id) === entry) inFlight.delete(request.id);
      });
  };
  const cancel = (requestId) => {
    const entry = inFlight.get(requestId);
    if (entry) abortEntry(entry);
  };
  const close = () => {
    if (closed) return;
    closed = true;
    for (const entry of inFlight.values()) abortEntry(entry);
    inFlight.clear();
  };

  return { start, cancel, close, writeError };
};
