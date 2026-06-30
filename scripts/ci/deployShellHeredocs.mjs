const SCRIPT_HEREDOC_PATTERN = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*SCRIPT[A-Za-z0-9_]*)\1/g;

const isHeredocEnd = (line, marker) => line === marker || line.replace(/^\t+/, '') === marker;

export const collectScriptHeredocs = (content) => {
  const lines = content.split(/\r?\n/);
  const heredocs = [];

  for (let index = 0; index < lines.length; index += 1) {
    SCRIPT_HEREDOC_PATTERN.lastIndex = 0;
    let match = SCRIPT_HEREDOC_PATTERN.exec(lines[index]);

    while (match) {
      const marker = match[2];
      const bodyLines = [];
      let endLine = -1;

      for (let bodyIndex = index + 1; bodyIndex < lines.length; bodyIndex += 1) {
        if (isHeredocEnd(lines[bodyIndex], marker)) {
          endLine = bodyIndex + 1;
          break;
        }
        bodyLines.push(lines[bodyIndex]);
      }

      heredocs.push({
        marker,
        startLine: index + 2,
        endLine,
        content: `${bodyLines.join('\n')}\n`,
      });

      match = SCRIPT_HEREDOC_PATTERN.exec(lines[index]);
    }
  }

  return heredocs;
};
