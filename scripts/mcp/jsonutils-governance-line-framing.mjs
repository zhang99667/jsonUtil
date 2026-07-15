import { TextDecoder } from 'node:util';

export const MAX_MCP_MESSAGE_BYTES = 1024 * 1024;
const STRICT_UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

export const serializeMcpMessage = message => `${JSON.stringify(message)}\n`;

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
        onMessage(JSON.parse(STRICT_UTF8_DECODER.decode(line)));
      } catch {
        onParseError();
      }
    }
  };
};
