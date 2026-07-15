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
  JsonutilsGovernanceRuntimeStaleError,
  buildJsonutilsGovernanceStaleRuntimeToolResult,
  createJsonutilsGovernanceRuntimeFreshnessGuard,
} from './jsonutils-governance-runtime-freshness.mjs';
import { assertJsonutilsGovernanceMethodParams, jsonRpcParseError } from './jsonutils-governance-jsonrpc.mjs';
import {
  createMcpLineParser,
  serializeMcpMessage,
} from './jsonutils-governance-line-framing.mjs';
import { createJsonutilsGovernanceMessageHandler } from './jsonutils-governance-session.mjs';

const SERVER_NAME = 'jsonutils-governance';
const SERVER_VERSION = '0.6.0';
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2024-11-05'];
const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];
export const JSONUTILS_GOVERNANCE_INSTRUCTIONS = [
  'JSONUtils governance MCP is read-only project context. Start with AGENTS.md and ai_handoff_brief; use ai_decision_summary or ai_asset_inventory when needed.',
  'Before changing AI assets, inspect ai_governance_scorecard and ai_evaluation_summary.',
  'Keep project source, marketplace discovery, install/enable, fresh-task registration, runtime/signer trust, component evidence, and behavior outcomes as separate evidence layers.',
  'This server never installs plugins, mutates the repository, or writes governance ledgers.',
].join(' ');
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export { callJsonutilsGovernanceTool, listJsonutilsGovernanceResources, listJsonutilsGovernanceTools };
export {
  createMcpLineParser,
  MAX_MCP_MESSAGE_BYTES,
  serializeMcpMessage,
} from './jsonutils-governance-line-framing.mjs';

export const handleJsonutilsGovernanceRequest = async (message, options = {}) => {
  const { method, params, id } = message;
  try {
    options.runtimeFreshnessGuard?.assertFresh();
    assertJsonutilsGovernanceMethodParams(method, params);
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(params?.protocolVersion)
      ? params.protocolVersion
      : LATEST_PROTOCOL_VERSION;
    const result = method === 'initialize'
      ? {
        protocolVersion,
        capabilities: { resources: {}, tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions: JSONUTILS_GOVERNANCE_INSTRUCTIONS,
      }
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
                options.runToolWorker,
                { signal: options.signal },
              )
              : method === 'ping'
                ? {}
                : null;
    options.runtimeFreshnessGuard?.assertFresh();
    if (result !== null) return { jsonrpc: '2.0', id, result };
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
  } catch (error) {
    if (error instanceof JsonutilsGovernanceRuntimeStaleError && method === 'tools/call') {
      return { jsonrpc: '2.0', id, result: buildJsonutilsGovernanceStaleRuntimeToolResult() };
    }
    throw error;
  }
};

const writeMessage = message => process.stdout.write(serializeMcpMessage(message));
const writeParseError = () => writeMessage(jsonRpcParseError());

export const startJsonutilsGovernanceServer = () => {
  const runtimeFreshnessGuard = createJsonutilsGovernanceRuntimeFreshnessGuard({
    rootDir,
    entryFile: fileURLToPath(import.meta.url),
  });
  const handleMessage = createJsonutilsGovernanceMessageHandler({
    handleRequest: (message, options) => handleJsonutilsGovernanceRequest(message, {
      ...options,
      runtimeFreshnessGuard,
    }),
    writeMessage,
  });
  const parseLine = createMcpLineParser(handleMessage, writeParseError);
  const closeSession = () => handleMessage.close();
  process.stdin.on('data', parseLine);
  process.stdin.once('end', closeSession);
  process.stdin.once('error', closeSession);
  process.stdin.once('close', closeSession);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startJsonutilsGovernanceServer();
}
