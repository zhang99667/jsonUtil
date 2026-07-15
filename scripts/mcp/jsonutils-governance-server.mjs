#!/usr/bin/env node
// 为 AI 助手暴露只读治理资源和固定治理工具。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listJsonutilsGovernanceResources,
  readJsonutilsGovernanceResource,
} from './jsonutils-governance-resources.mjs';
import {
  callJsonutilsGovernanceTool,
  listJsonutilsGovernanceTools,
} from './jsonutils-governance-tools.mjs';
import {
  assertJsonutilsGovernanceMethodParams,
  inspectJsonRpcRequest,
  JsonRpcInvalidParamsError,
  jsonRpcInternalError,
  jsonRpcInvalidParams,
  jsonRpcInvalidRequest,
  jsonRpcParseError,
} from './jsonutils-governance-jsonrpc.mjs';
import { JsonutilsGovernanceToolInputError } from './jsonutils-governance-tool-input.mjs';

const SERVER_NAME = 'jsonutils-governance';
const SERVER_VERSION = '0.3.0';
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2024-11-05'];
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];
export const MAX_MCP_MESSAGE_BYTES = 1024 * 1024;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export { callJsonutilsGovernanceTool, listJsonutilsGovernanceResources, listJsonutilsGovernanceTools };

export const handleJsonutilsGovernanceRequest = async (message, options = {}) => {
  const { method, params, id } = message;
  assertJsonutilsGovernanceMethodParams(method, params);
  const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(params?.protocolVersion)
    ? params.protocolVersion
    : LATEST_PROTOCOL_VERSION;
  const result = method === 'initialize'
    ? { protocolVersion, capabilities: { resources: {}, tools: {} }, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION } }
    : method === 'resources/list'
      ? listJsonutilsGovernanceResources()
      : method === 'resources/read'
        ? readJsonutilsGovernanceResource(params?.uri, options.rootDir ?? rootDir)
        : method === 'tools/list'
          ? listJsonutilsGovernanceTools()
          : method === 'tools/call'
            ? await callJsonutilsGovernanceTool(
              params?.name,
              params && Object.hasOwn(params, 'arguments') ? params.arguments : {},
              options.runScript,
            )
            : method === 'ping'
              ? {}
              : null;

  if (result !== null) return { jsonrpc: '2.0', id, result };
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
};

export const serializeMcpMessage = message => `${JSON.stringify(message)}\n`;

const writeMessage = message => process.stdout.write(serializeMcpMessage(message));
const writeParseError = () => writeMessage(jsonRpcParseError());

const handleMessage = async (message) => {
  const request = inspectJsonRpcRequest(message);
  if (!request.valid) {
    writeMessage(jsonRpcInvalidRequest(message));
    return;
  }
  try {
    const response = await handleJsonutilsGovernanceRequest(message);
    if (!request.isNotification) writeMessage(response);
  } catch (error) {
    if (request.isNotification) return;
    if (error instanceof JsonRpcInvalidParamsError || error instanceof JsonutilsGovernanceToolInputError) {
      writeMessage(jsonRpcInvalidParams(request.id));
      return;
    }
    writeMessage(jsonRpcInternalError(request.id));
  }
};

export const createMcpLineParser = (onMessage, onParseError = () => {}) => {
  let buffer = Buffer.alloc(0);
  return (chunk) => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
    if (buffer.length > MAX_MCP_MESSAGE_BYTES && buffer.indexOf(0x0a) === -1) {
      buffer = Buffer.alloc(0);
      onParseError();
      return;
    }
    while (true) {
      const lineEnd = buffer.indexOf(0x0a);
      if (lineEnd === -1) return;
      let line = buffer.subarray(0, lineEnd);
      buffer = buffer.subarray(lineEnd + 1);
      if (line.at(-1) === 0x0d) line = line.subarray(0, -1);
      if (line.length === 0) continue;
      if (line.length > MAX_MCP_MESSAGE_BYTES) {
        onParseError();
        continue;
      }
      try {
        onMessage(JSON.parse(line.toString('utf8')));
      } catch {
        onParseError();
      }
    }
  };
};

export const startJsonutilsGovernanceServer = () => {
  const parseLine = createMcpLineParser(handleMessage, writeParseError);
  process.stdin.on('data', parseLine);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startJsonutilsGovernanceServer();
}
