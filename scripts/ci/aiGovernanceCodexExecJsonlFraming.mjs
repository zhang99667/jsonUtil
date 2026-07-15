export const CODEX_EXEC_MAX_JSONL_LINE_BYTES = 1024 * 1024;
export const CODEX_EXEC_MAX_JSONL_EVENTS = 10_000;

const isStrictUtf8 = (text, bytes) => Buffer.from(text, 'utf8').equals(bytes);

export const createCodexExecJsonlFramer = ({ onValue, onDropEvent }) => {
  let pending = Buffer.alloc(0);
  let discardingOversizedLine = false;
  let parsedLines = 0;

  const processLine = (line) => {
    parsedLines += 1;
    if (parsedLines > CODEX_EXEC_MAX_JSONL_EVENTS) {
      onDropEvent('dropped-events');
      return;
    }
    const content = line.at(-1) === 13 ? line.subarray(0, -1) : line;
    if (content.length === 0) {
      onDropEvent('malformed-jsonl');
      return;
    }
    const text = content.toString('utf8');
    if (!isStrictUtf8(text, content)) {
      onDropEvent('malformed-jsonl');
      return;
    }
    try {
      onValue(JSON.parse(text));
    } catch {
      onDropEvent('malformed-jsonl');
    }
  };

  const acceptSegment = (segment, lineEnded) => {
    if (discardingOversizedLine) {
      if (lineEnded) discardingOversizedLine = false;
      return;
    }
    const lineBytes = pending.length + segment.length;
    if (lineBytes > CODEX_EXEC_MAX_JSONL_LINE_BYTES) {
      pending = Buffer.alloc(0);
      discardingOversizedLine = !lineEnded;
      onDropEvent('dropped-events');
      return;
    }
    if (!lineEnded) {
      pending = pending.length === 0
        ? Buffer.from(segment)
        : Buffer.concat([pending, segment], lineBytes);
      return;
    }
    const line = pending.length === 0
      ? segment
      : Buffer.concat([pending, segment], lineBytes);
    pending = Buffer.alloc(0);
    processLine(line);
  };

  const push = (chunk) => {
    const data = Buffer.from(chunk);
    let offset = 0;
    for (;;) {
      const newline = data.indexOf(10, offset);
      if (newline < 0) break;
      acceptSegment(data.subarray(offset, newline), true);
      offset = newline + 1;
    }
    if (offset < data.length) acceptSegment(data.subarray(offset), false);
  };

  const finalize = () => {
    if (pending.length > 0 || discardingOversizedLine) onDropEvent('truncated-jsonl');
  };

  return { push, finalize };
};
