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

const SERVER_NAME = 'jsonutils-governance';
const SERVER_VERSION = '0.1.0';
const PROTOCOL_VERSION = '2024-11-05';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export { callJsonutilsGovernanceTool, listJsonutilsGovernanceResources, listJsonutilsGovernanceTools };

export const handleJsonutilsGovernanceRequest = async (message, options = {}) => {
  const { method, params, id } = message;
  const result = method === 'initialize'
    ? { protocolVersion: PROTOCOL_VERSION, capabilities: { resources: {}, tools: {} }, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION } }
    : method === 'resources/list'
      ? listJsonutilsGovernanceResources()
      : method === 'resources/read'
        ? readJsonutilsGovernanceResource(params?.uri, options.rootDir ?? rootDir)
        : method === 'tools/list'
          ? listJsonutilsGovernanceTools()
          : method === 'tools/call'
            ? await callJsonutilsGovernanceTool(params?.name, params?.arguments ?? {}, options.runScript)
            : method === 'ping'
              ? {}
              : null;

  if (result !== null) return { jsonrpc: '2.0', id, result };
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
};

const writeMessage = (message) => {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
};

const handleMessage = async (message) => {
  if (message.method?.startsWith('notifications/')) return;
  try {
    writeMessage(await handleJsonutilsGovernanceRequest(message));
  } catch (error) {
    writeMessage({
      jsonrpc: '2.0',
      id: message.id,
      error: { code: -32000, message: error instanceof Error ? error.message : String(error) },
    });
  }
};

export const createMcpFrameParser = (onMessage) => {
  let buffer = Buffer.alloc(0);
  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;
      const header = buffer.subarray(0, headerEnd).toString('utf8');
      const length = Number(header.match(/Content-Length:\s*(\d+)/i)?.[1]);
      const bodyStart = headerEnd + 4;
      if (!Number.isFinite(length) || buffer.length < bodyStart + length) return;
      const body = buffer.subarray(bodyStart, bodyStart + length).toString('utf8');
      buffer = buffer.subarray(bodyStart + length);
      onMessage(JSON.parse(body));
    }
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const parseFrame = createMcpFrameParser(handleMessage);
  process.stdin.on('data', parseFrame);
}
