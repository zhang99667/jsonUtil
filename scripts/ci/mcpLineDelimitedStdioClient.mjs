export const serializeMessage = message => `${JSON.stringify(message)}\n`;

const DEFAULT_MAX_BUFFERED_BYTES = 1024 * 1024;
const DEFAULT_MAX_QUEUED_MESSAGES = 64;

const positiveIntegerOption = (value, fallback, name) => {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${name} must be a positive safe integer`);
  return value;
};

export const createMessageReader = (stream, _getStderr, options = {}) => {
  const maxBufferedBytes = positiveIntegerOption(
    options.maxBufferedBytes,
    DEFAULT_MAX_BUFFERED_BYTES,
    'maxBufferedBytes',
  );
  const maxQueuedMessages = positiveIntegerOption(
    options.maxQueuedMessages,
    DEFAULT_MAX_QUEUED_MESSAGES,
    'maxQueuedMessages',
  );
  let buffer = Buffer.alloc(0);
  const messages = [];
  const waiters = [];
  let failure;

  const fail = (error) => {
    if (failure) return;
    failure = error;
    buffer = Buffer.alloc(0);
    messages.length = 0;
    while (waiters.length) waiters.shift().reject(error);
  };
  const emit = (message) => {
    if (waiters.length) {
      waiters.shift().resolve(message);
      return;
    }
    if (messages.length >= maxQueuedMessages) {
      fail(new Error('MCP stdout message queue limit exceeded'));
      return;
    }
    messages.push(message);
  };

  const consumeLine = (lineBytes) => {
    let line = lineBytes;
    if (line.at(-1) === 0x0d) line = line.subarray(0, -1);
    if (line.length === 0) return;
    try {
      emit(JSON.parse(line.toString('utf8')));
    } catch {
      fail(new Error('Invalid MCP stdout JSON line'));
    }
  };

  stream.on('data', (chunk) => {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    let offset = 0;
    while (!failure && offset < bytes.length) {
      const lineEnd = bytes.indexOf(0x0a, offset);
      const segmentEnd = lineEnd === -1 ? bytes.length : lineEnd;
      const segment = bytes.subarray(offset, segmentEnd);
      const combinedLength = buffer.length + segment.length;
      if (combinedLength > maxBufferedBytes) {
        fail(new Error('MCP stdout buffer limit exceeded'));
        return;
      }
      if (lineEnd === -1) {
        buffer = buffer.length === 0
          ? Buffer.from(segment)
          : Buffer.concat([buffer, segment], combinedLength);
        return;
      }
      const line = buffer.length === 0
        ? segment
        : Buffer.concat([buffer, segment], combinedLength);
      buffer = Buffer.alloc(0);
      consumeLine(line);
      offset = lineEnd + 1;
    }
  });
  stream.on('error', () => fail(new Error('MCP stdout stream failed')));
  stream.on('end', () => fail(new Error('MCP stdout ended early')));

  return (timeoutMs = 5000) => {
    if (failure) return Promise.reject(failure);
    if (messages.length) return Promise.resolve(messages.shift());
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (message) => {
          clearTimeout(timeout);
          resolve(message);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      };
      const timeout = setTimeout(() => {
        const index = waiters.indexOf(waiter);
        if (index !== -1) waiters.splice(index, 1);
        reject(new Error('Timed out waiting for MCP response'));
      }, timeoutMs);
      waiters.push(waiter);
    });
  };
};

export const request = async (child, readMessage, id, method, params, timeoutMs = 5000) => {
  child.stdin.write(serializeMessage({
    jsonrpc: '2.0',
    id,
    method,
    ...(params ? { params } : {}),
  }));
  const response = await readMessage(timeoutMs);
  if (!response || typeof response !== 'object' || Array.isArray(response) || response.jsonrpc !== '2.0') {
    throw new Error('MCP response envelope mismatch');
  }
  if (response.id !== id) {
    throw new Error('MCP response id mismatch');
  }
  return response;
};
