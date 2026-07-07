const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getMarkdownHeadingLevel = (heading) => {
  const match = heading.match(/^(#{1,6})\s+/);
  return match ? match[1].length : null;
};

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
  const headingMatcher = /\n(#{1,6})\s+[^\n]+/g;
  let nextHeadingMatch = headingMatcher.exec(remainingContent);

  while (nextHeadingMatch) {
    if (nextHeadingMatch[1].length <= sectionLevel) {
      return remainingContent.slice(0, nextHeadingMatch.index);
    }
    nextHeadingMatch = headingMatcher.exec(remainingContent);
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
