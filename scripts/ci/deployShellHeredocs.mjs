const SCRIPT_HEREDOC_PATTERN = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*SCRIPT[A-Za-z0-9_]*)\1/g;

const isHeredocEnd = (line, marker) => line === marker || line.replace(/^\t+/, '') === marker;

const readHeredocBody = (lines, marker, startIndex) => {
  const bodyLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (isHeredocEnd(lines[index], marker)) {
      return { endLine: index + 1, content: `${bodyLines.join('\n')}\n` };
    }
    bodyLines.push(lines[index]);
  }
  return { endLine: null, content: `${bodyLines.join('\n')}\n` };
};

export const collectScriptHeredocs = (content) => {
  const lines = content.split(/\r?\n/);
  const heredocs = [];

  for (let index = 0; index < lines.length; index += 1) {
    SCRIPT_HEREDOC_PATTERN.lastIndex = 0;
    let match = SCRIPT_HEREDOC_PATTERN.exec(lines[index]);

    while (match) {
      const marker = match[2];
      const body = readHeredocBody(lines, marker, index + 1);

      heredocs.push({
        marker,
        startLine: index + 2,
        ...body,
      });

      match = SCRIPT_HEREDOC_PATTERN.exec(lines[index]);
    }
  }

  return heredocs;
};
