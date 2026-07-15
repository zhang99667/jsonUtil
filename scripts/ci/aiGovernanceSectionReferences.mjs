const ATX_HEADING_PATTERN = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const FENCE_OPEN_PATTERN = /^ {0,3}(`{3,}|~{3,})(.*)$/;

const parseAtxHeading = (line) => {
  const match = line.match(ATX_HEADING_PATTERN);
  if (!match) return null;
  return {
    level: match[1].length,
    text: (match[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trimEnd(),
  };
};

const parseFenceOpening = (line) => {
  const match = line.match(FENCE_OPEN_PATTERN);
  if (!match || (match[1][0] === '`' && match[2].includes('`'))) return null;
  return { marker: match[1][0], length: match[1].length };
};

const isFenceClosing = (line, fence) => {
  const match = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
  return Boolean(match && match[1][0] === fence.marker && match[1].length >= fence.length);
};

const sameHeading = (left, right) => left.level === right.level && left.text === right.text;

export const getMarkdownSectionContent = (content, sectionTitle) => {
  const target = parseAtxHeading(sectionTitle);
  if (!target) return null;

  let fence = null;
  let found = false;
  let collecting = false;
  const sectionLines = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (fence) {
      if (collecting) sectionLines.push(rawLine);
      if (isFenceClosing(line, fence)) fence = null;
      continue;
    }
    const opening = parseFenceOpening(line);
    if (opening) {
      if (collecting) sectionLines.push(rawLine);
      fence = opening;
      continue;
    }
    const heading = parseAtxHeading(line);
    if (heading) {
      if (!found && sameHeading(heading, target)) {
        found = true;
        collecting = true;
        continue;
      }
      if (collecting && heading.level <= target.level) collecting = false;
    }
    if (collecting) sectionLines.push(rawLine);
  }

  return found && fence === null ? sectionLines.join('\n') : null;
};

export const collectSectionReferenceFailures = (file, content, sectionRules = []) => (
  sectionRules.flatMap(({ sectionTitle, contains }) => {
    const sectionContent = getMarkdownSectionContent(content, sectionTitle);
    if (sectionContent === null) return [`${file}: 缺少 ${sectionTitle} 章节，无法检查引用`];

    return contains
      .filter(expectedText => !sectionContent.includes(expectedText))
      .map(expectedText => `${file}: ${sectionTitle} 缺少 "${expectedText}"`);
  })
);
