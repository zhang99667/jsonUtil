const isHeredocEnd = (line, marker) => line === marker || line.replace(/^\t+/, '') === marker;

export const readHeredocBody = (lines, marker, startIndex) => {
  const bodyLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (isHeredocEnd(lines[index], marker)) {
      return { endLine: index + 1, content: `${bodyLines.join('\n')}\n` };
    }
    bodyLines.push(lines[index]);
  }
  return { endLine: null, content: `${bodyLines.join('\n')}\n` };
};
