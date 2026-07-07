const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getMarkdownHeadingLevel = heading => heading.match(/^(#{1,6})\s+/)?.[1].length ?? null;

const findMarkdownHeadingStart = (content, sectionTitle) => {
  const pattern = new RegExp(`(^|\\n)${escapeRegExp(sectionTitle)}(?:\\n|$)`);
  const match = content.match(pattern);
  return match ? match.index + match[1].length : -1;
};

export const getMarkdownSectionContent = (content, sectionTitle) => {
  const sectionLevel = getMarkdownHeadingLevel(sectionTitle);
  const sectionStart = findMarkdownHeadingStart(content, sectionTitle);
  if (sectionLevel === null || sectionStart === -1) return null;

  const bodyStart = sectionStart + sectionTitle.length;
  const remainingContent = content.slice(bodyStart);
  const lines = remainingContent.split('\n');
  let offset = 0;
  let isInFence = false;

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) isInFence = !isInFence;

    const headingMatch = !isInFence && line.match(/^(#{1,6})\s+/);
    if (headingMatch && headingMatch[1].length <= sectionLevel) return remainingContent.slice(0, offset);
    offset += line.length + 1;
  }

  return remainingContent;
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
