const frame = (message) => {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
};

export const createFrameReader = (stream, getStderr) => {
  let buffer = Buffer.alloc(0);
  const messages = [];
  const waiters = [];
  let failure;

  const fail = (error) => {
    failure = error;
    while (waiters.length) waiters.shift().reject(error);
  };
  const emit = message => (waiters.length ? waiters.shift().resolve(message) : messages.push(message));

  stream.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (!failure) {
      const headerEnd = buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) return;
      const header = buffer.subarray(0, headerEnd).toString('utf8').trim();
      const length = Number(/^Content-Length:\s*(\d+)$/i.exec(header)?.[1]);
      if (!Number.isFinite(length)) return fail(new Error(`Invalid MCP stdout header: ${header}`));
      const bodyStart = headerEnd + 4;
      if (buffer.length < bodyStart + length) return;
      const body = buffer.subarray(bodyStart, bodyStart + length).toString('utf8');
      buffer = buffer.subarray(bodyStart + length);
      emit(JSON.parse(body));
    }
  });
  stream.on('end', () => fail(new Error(`MCP stdout ended early. stderr: ${getStderr()}`)));

  return (timeoutMs = 5000) => {
    if (failure) return Promise.reject(failure);
    if (messages.length) return Promise.resolve(messages.shift());
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for MCP response. stderr: ${getStderr()}`)), timeoutMs);
      waiters.push({
        resolve: message => {
          clearTimeout(timeout);
          resolve(message);
        },
        reject,
      });
    });
  };
};

export const request = async (child, readFrame, id, method, params, timeoutMs = 5000) => {
  child.stdin.write(frame({
    jsonrpc: '2.0',
    id,
    method,
    ...(params ? { params } : {}),
  }));
  return readFrame(timeoutMs);
};
