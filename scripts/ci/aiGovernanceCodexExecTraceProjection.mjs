import { createHash } from 'node:crypto';
import { createCodexExecJsonlFramer } from './aiGovernanceCodexExecJsonlFraming.mjs';

export const CODEX_EXEC_TRACE_ADAPTER = Object.freeze({ id: 'codex-exec-jsonl', version: '1.2.1' });

const SUPPORTED_CLI_VERSIONS = new Set(['0.132.0', '0.144.0-alpha.4']);
const TOP_LEVEL_TYPES = new Set([
  'thread.started', 'turn.started', 'turn.completed', 'turn.failed',
  'item.started', 'item.updated', 'item.completed', 'error',
]);
const ITEM_TYPES = new Set([
  'agent_message', 'reasoning', 'command_execution', 'file_change', 'mcp_tool_call',
  'collab_tool_call', 'web_search', 'todo_list', 'error',
]);
const OPERATION_TYPES = new Set([
  'command_execution', 'file_change', 'mcp_tool_call', 'collab_tool_call', 'web_search',
]);
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$/;
const SAFE_KEY = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const SAFE_KEY_SEGMENT = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const STREAM_LAG = /^in-process app-server event stream lagged; dropped ([1-9]\d*) events$/;
const MAX_KEYS = 20;
const MAX_KEY_DEPTH = 3;
const MAX_TRACE_EVENTS = 200;

const sha256 = value => createHash('sha256').update(value).digest('hex');
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const operationId = id => `op-${sha256(Buffer.from(id, 'utf8')).slice(0, 24)}`;
const itemFailed = item => ['failed', 'error'].includes(item.status)
  || item.error !== undefined && item.error !== null
  || Number.isInteger(item.exit_code) && item.exit_code !== 0;

export const createCodexExecJsonlProjector = (cliVersion, {
  mcpResultKeyAllowlist = {},
} = {}) => {
  const events = [];
  const reasons = new Set();
  const items = new Map();
  let sourceEvents = 0;
  let threadStarts = 0;
  let turnStarts = 0;
  let turnTerminals = 0;
  let terminalType;
  let finalMessageSha256;
  let errorEventSeen = false;
  let droppedEvents = 0;
  let droppedAttributes = 0;
  let droppedLinks = 0;

  const reason = code => reasons.add(code);
  const dropEvent = (code, count = 1) => { reason(code); droppedEvents += count; };
  const dropAttribute = (code) => { reason(code); droppedAttributes += 1; };
  const dropLink = (code) => { reason(code); droppedLinks += 1; };
  const append = (event, { final = false } = {}) => {
    const limit = final ? MAX_TRACE_EVENTS : MAX_TRACE_EVENTS - 2;
    if (events.length >= limit) {
      dropEvent('dropped-events');
      return false;
    }
    events.push({ sequence: events.length + 1, ...event });
    return true;
  };

  const safeKeys = (value, { missingIsEmpty = true, recursive = false } = {}) => {
    if (value === undefined || value === null) return [];
    let record = value;
    if (typeof value === 'string') {
      try {
        record = JSON.parse(value);
      } catch {
        if (!missingIsEmpty) dropAttribute('unsafe-mcp-keys');
        return [];
      }
    }
    if (!isRecord(record)) {
      if (!missingIsEmpty) dropAttribute('unsafe-mcp-keys');
      return [];
    }
    if (!recursive) {
      const keys = Object.keys(record).sort();
      const safe = keys.filter(key => SAFE_KEY.test(key)).slice(0, MAX_KEYS);
      if (safe.length !== keys.length) dropAttribute('unsafe-mcp-keys');
      return safe;
    }

    const structured = isRecord(record.structured_content)
      ? record.structured_content
      : isRecord(record.structuredContent) ? record.structuredContent : record;
    const paths = [];
    let unsafe = false;
    const addPath = (segments) => {
      const valuePath = segments.join('.');
      if (valuePath.length > 64 || paths.length >= MAX_KEYS) unsafe = true;
      else paths.push(valuePath);
    };
    const visit = (current, prefix = []) => {
      for (const key of Object.keys(current).sort()) {
        if (!SAFE_KEY_SEGMENT.test(key)) {
          unsafe = true;
          continue;
        }
        const segments = [...prefix, key];
        const child = current[key];
        if (isRecord(child) && Object.keys(child).length > 0) {
          if (segments.length >= MAX_KEY_DEPTH) unsafe = true;
          else visit(child, segments);
        } else addPath(segments);
      }
    };
    visit(structured);
    if (unsafe) dropAttribute('unsafe-mcp-keys');
    return paths;
  };

  const allowlistedResultKeys = (value, allowedPaths) => {
    let record = value;
    if (typeof value === 'string') {
      try { record = JSON.parse(value); } catch { record = undefined; }
    }
    if (!isRecord(record)) {
      dropAttribute('missing-required-mcp-result-key');
      return [];
    }
    const structured = isRecord(record.structured_content)
      ? record.structured_content
      : isRecord(record.structuredContent) ? record.structuredContent : record;
    const found = [];
    for (const valuePath of allowedPaths) {
      const segments = valuePath.split('.');
      let current = structured;
      for (const segment of segments) current = isRecord(current) ? current[segment] : undefined;
      if (current === undefined) dropAttribute('missing-required-mcp-result-key');
      else found.push(valuePath);
    }
    return found;
  };

  const mcpProjection = (item, phase, record) => {
    const server = typeof item.server === 'string' && SAFE_NAME.test(item.server) ? item.server : undefined;
    const tool = typeof item.tool === 'string' && SAFE_NAME.test(item.tool) ? item.tool : undefined;
    if (!server || !tool) {
      dropAttribute('unsafe-mcp-name');
      record.projectable = false;
      return;
    }
    const name = `${server}/${tool}`;
    if (phase === 'call') {
      record.mcpName = name;
      record.projectable = true;
      append({
        type: 'mcp.call', actorId: 'root', operationId: record.operationId,
        name, status: 'started', keys: safeKeys(item.arguments, { missingIsEmpty: false }),
      });
      return;
    }
    if (record.mcpName && record.mcpName !== name) dropLink('operation-metadata-mismatch');
    if (record.projectable === false) return;
    append({
      type: 'mcp.result', actorId: 'root', operationId: record.operationId, name,
      status: itemFailed(item) ? 'failed' : 'passed',
      keys: Array.isArray(mcpResultKeyAllowlist[name])
        ? allowlistedResultKeys(item.result, mcpResultKeyAllowlist[name])
        : safeKeys(item.result, { recursive: true }),
    });
  };

  const projectStart = (item, record) => {
    if (item.type === 'mcp_tool_call') mcpProjection(item, 'call', record);
    if (item.type === 'command_execution') append({
      type: 'command.call', actorId: 'root', operationId: record.operationId,
      name: 'shell', status: 'started',
    });
    if (item.type === 'file_change') reason('file-change-unverifiable');
  };

  const projectCompletion = (item, record) => {
    if (item.type === 'mcp_tool_call') mcpProjection(item, 'result', record);
    if (item.type === 'command_execution') append({
      type: 'command.result', actorId: 'root', operationId: record.operationId,
      name: 'shell', status: itemFailed(item) ? 'failed' : 'passed',
    });
    if (item.type === 'file_change') reason('file-change-unverifiable');
    if (item.type === 'web_search' || item.type === 'collab_tool_call') append({
      type: 'capability.use', actorId: 'root',
      name: item.type === 'web_search' ? 'web_search' : 'collaboration',
      status: itemFailed(item) ? 'failed' : 'passed',
    });
    if (item.type === 'agent_message') {
      if (typeof item.text === 'string') finalMessageSha256 = sha256(Buffer.from(item.text, 'utf8'));
      else dropAttribute('missing-final-agent-message');
    }
    if (item.type === 'error') {
      errorEventSeen = true;
      const lag = typeof item.message === 'string' ? item.message.match(STREAM_LAG) : undefined;
      const count = lag ? Number(lag[1]) : undefined;
      if (Number.isSafeInteger(count)) dropEvent('stream-lag', count);
      else reason('codex-error-item');
    }
  };

  const processItem = (sourceType, item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 500) {
      dropEvent('malformed-item');
      return;
    }
    if (!ITEM_TYPES.has(item.type)) {
      dropEvent('unknown-item-type');
      return;
    }
    const id = operationId(item.id);
    let record = items.get(id);
    if (record && record.type !== item.type) dropLink('operation-type-mismatch');
    if (sourceType === 'item.started') {
      if (record?.started) reason('duplicate-item-start');
      if (record?.completed) reason('item-after-completion');
      if (!record) {
        record = { type: item.type, operationId: id, started: false, completed: false };
        items.set(id, record);
      }
      record.started = true;
      projectStart(item, record);
      return;
    }
    if (sourceType === 'item.updated') {
      if (!record?.started) reason('item-update-without-start');
      if (record?.completed) reason('item-after-completion');
      return;
    }
    if (record?.completed) reason('duplicate-item-completion');
    if (!record) {
      record = { type: item.type, operationId: id, started: false, completed: false };
      items.set(id, record);
    }
    if (OPERATION_TYPES.has(item.type) && !record.started) dropLink('operation-start-missing');
    record.completed = true;
    projectCompletion(item, record);
  };

  const processEvent = (value) => {
    sourceEvents += 1;
    if (!isRecord(value) || !TOP_LEVEL_TYPES.has(value.type)) {
      dropEvent('unknown-event-type');
      return;
    }
    if (value.type === 'thread.started') {
      threadStarts += 1;
      if (threadStarts > 1) reason('duplicate-thread-started');
      if (sourceEvents !== 1) reason('lifecycle-order-invalid');
      if (threadStarts === 1) append({ type: 'session.start', actorId: 'root' });
      return;
    }
    if (value.type === 'turn.started') {
      turnStarts += 1;
      if (turnStarts > 1) reason('duplicate-turn-started');
      if (threadStarts !== 1 || turnTerminals > 0) reason('lifecycle-order-invalid');
      return;
    }
    if (value.type === 'turn.completed' || value.type === 'turn.failed') {
      turnTerminals += 1;
      if (turnTerminals > 1) reason('duplicate-turn-terminal');
      if (turnStarts !== 1) reason('lifecycle-order-invalid');
      if (!terminalType) terminalType = value.type;
      if (value.type === 'turn.failed') reason('turn-failed');
      return;
    }
    if (value.type.startsWith('item.')) {
      if (turnStarts !== 1) reason('item-before-turn');
      if (turnTerminals > 0) reason('item-after-terminal');
      processItem(value.type, value.item);
      return;
    }
    errorEventSeen = true;
    reason('codex-error-event');
  };

  const framer = createCodexExecJsonlFramer({ onValue: processEvent, onDropEvent: dropEvent });

  const finalize = ({ exitCode, stdoutDrained, timedOut, binaryStable, outputLimitExceeded = false }) => {
    framer.finalize();
    if (!SUPPORTED_CLI_VERSIONS.has(cliVersion)) reason('unsupported-cli-version');
    if (threadStarts === 0) reason('missing-thread-started');
    if (turnStarts === 0) reason('missing-turn-started');
    if (turnTerminals === 0) reason('missing-turn-terminal');
    if (threadStarts > 1) reason('duplicate-thread-started');
    if (turnStarts > 1) reason('duplicate-turn-started');
    if (turnTerminals > 1) reason('duplicate-turn-terminal');
    for (const record of items.values()) {
      if (!record.started || record.completed) continue;
      if (OPERATION_TYPES.has(record.type)) dropLink('operation-completion-missing');
      else reason('item-completion-missing');
    }
    if (!finalMessageSha256) reason('missing-final-agent-message');
    if (exitCode !== 0) reason('nonzero-exit');
    if (!stdoutDrained) reason('stdout-not-drained');
    if (timedOut) reason('execution-timeout');
    if (!binaryStable) reason('binary-changed-during-capture');
    if (outputLimitExceeded) reason('output-limit-exceeded');

    const failed = terminalType === 'turn.failed' || exitCode !== 0 || errorEventSeen;
    const status = reasons.size === 0 ? 'passed' : failed ? 'failed' : 'partial';
    if (threadStarts > 0) {
      if (finalMessageSha256) append({
        type: 'response.finish', actorId: 'root', sha256: finalMessageSha256, status,
      }, { final: true });
      append({ type: 'session.finish', actorId: 'root', status }, { final: true });
    }
    const completenessStatus = reasons.size === 0 ? 'complete' : 'partial';
    return {
      trace: {
        adapter: CODEX_EXEC_TRACE_ADAPTER,
        capture: {
          status: completenessStatus, sampling: 'all', droppedEvents,
          droppedAttributes, droppedLinks,
          flushStatus: stdoutDrained && !reasons.has('truncated-jsonl') ? 'succeeded' : 'failed',
        },
        events,
      },
      completeness: { status: completenessStatus, reasons: [...reasons] },
    };
  };
  return { push: framer.push, finalize };
};
