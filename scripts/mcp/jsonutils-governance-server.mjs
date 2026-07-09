#!/usr/bin/env node
// 为 AI 助手暴露只读治理上下文和固定治理报告工具。

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SERVER_NAME = 'jsonutils-governance';
const SERVER_VERSION = '0.1.0';
const PROTOCOL_VERSION = '2024-11-05';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const resources = [
  ['jsonutils://ai-governance/playbook', 'AI Engineering Playbook', 'docs/AI-ENGINEERING-PLAYBOOK.md'],
  ['jsonutils://ai-governance/asset-registry', 'AI Asset Registry', 'docs/AI-ASSET-REGISTRY.md'],
  ['jsonutils://ai-governance/decisions', 'AI Governance Decisions', 'docs/AI-GOVERNANCE-DECISIONS.md'],
  ['jsonutils://ai-governance/maintainer-skill', 'JSONUtils Maintainer Skill', '.codex/skills/jsonutils-maintainer/SKILL.md'],
].map(([uri, name, file]) => ({
  uri,
  name,
  description: `JSONUtils ${name}`,
  mimeType: 'text/markdown',
  file,
}));

const governanceReportTool = {
  name: 'ai_governance_report',
  description: 'Run check-ai-governance and return its machine-readable JSON report.',
  inputSchema: { type: 'object', additionalProperties: false, properties: {} },
};

const budgetReportTool = {
  name: 'maintainability_budget_report',
  description: 'Run check-maintainability-budgets with JSON output and a bounded top list.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      top: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
    },
  },
};

const tools = [governanceReportTool, budgetReportTool];

const runNodeScript = (script, args = []) => new Promise((resolve) => {
  execFile(process.execPath, [script, ...args], {
    cwd: rootDir,
    maxBuffer: 1024 * 1024 * 20,
  }, (error, stdout, stderr) => {
    resolve({ exitCode: error?.code ?? 0, stdout, stderr });
  });
});

const readResource = (uri, cwd = rootDir) => {
  const resource = resources.find(item => item.uri === uri);
  if (!resource) throw new Error(`Unknown resource: ${uri}`);
  const filePath = path.join(cwd, resource.file);
  return {
    contents: [{
      uri,
      mimeType: resource.mimeType,
      text: fs.readFileSync(filePath, 'utf8'),
    }],
  };
};

const normalizeTop = value => Math.min(50, Math.max(1, Number.isInteger(value) ? value : 10));

export const listJsonutilsGovernanceResources = () => ({
  resources: resources.map(({ file, ...resource }) => resource),
});

export const listJsonutilsGovernanceTools = () => ({ tools });

export const callJsonutilsGovernanceTool = async (name, args = {}, runScript = runNodeScript) => {
  const commandArgs = name === budgetReportTool.name
    ? ['--json', '--no-all', '--top', String(normalizeTop(args.top))]
    : ['--json'];
  const script = name === budgetReportTool.name
    ? 'scripts/ci/check-maintainability-budgets.mjs'
    : name === governanceReportTool.name
      ? 'scripts/ci/check-ai-governance.mjs'
      : null;
  if (!script) throw new Error(`Unknown tool: ${name}`);

  const result = await runScript(script, commandArgs);
  const text = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  return {
    content: [{ type: 'text', text }],
    isError: result.exitCode !== 0,
  };
};

export const handleJsonutilsGovernanceRequest = async (message, options = {}) => {
  const { method, params, id } = message;
  const result = method === 'initialize'
    ? { protocolVersion: PROTOCOL_VERSION, capabilities: { resources: {}, tools: {} }, serverInfo: { name: SERVER_NAME, version: SERVER_VERSION } }
    : method === 'resources/list'
      ? listJsonutilsGovernanceResources()
      : method === 'resources/read'
        ? readResource(params?.uri, options.rootDir ?? rootDir)
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
