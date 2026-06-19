import { normalizeAppVersion } from './appVersion';

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  versionLabel: string;
  date?: string;
  title: string;
  sections: ChangelogSection[];
}

export const APP_CHANGELOG_MARKDOWN = import.meta.env.VITE_APP_CHANGELOG || '';

const ENTRY_HEADING_PATTERN = /^##\s+v?([^\s(]+)(?:\s+\(([^)]+)\))?(?:\s+-\s*(.+))?\s*$/;
const SECTION_HEADING_PATTERN = /^###\s+(.+)\s*$/;
const LIST_ITEM_PATTERN = /^-\s+(.+)\s*$/;

export const formatChangelogText = (text: string): string => (
  text
    .replace(/\*\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
);

const createFallbackSection = (): ChangelogSection => ({
  title: '更新内容',
  items: [],
});

export const parseChangelog = (markdown: string, limit = 12): ChangelogEntry[] => {
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: ChangelogSection | null = null;

  const pushEntry = () => {
    if (!currentEntry) return;

    const sections = currentEntry.sections
      .map(section => ({
        title: formatChangelogText(section.title),
        items: section.items.map(formatChangelogText).filter(Boolean),
      }))
      .filter(section => section.items.length > 0);

    entries.push({
      ...currentEntry,
      title: formatChangelogText(currentEntry.title),
      sections,
    });
  };

  for (const line of markdown.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    const entryMatch = trimmedLine.match(ENTRY_HEADING_PATTERN);
    if (entryMatch) {
      pushEntry();
      const version = normalizeAppVersion(entryMatch[1]);
      currentEntry = {
        version,
        versionLabel: `v${version}`,
        ...(entryMatch[2] ? { date: entryMatch[2] } : {}),
        title: entryMatch[3] || '版本更新',
        sections: [],
      };
      currentSection = null;
      if (entries.length >= limit) break;
      continue;
    }

    if (!currentEntry) continue;

    const sectionMatch = trimmedLine.match(SECTION_HEADING_PATTERN);
    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1],
        items: [],
      };
      currentEntry.sections.push(currentSection);
      continue;
    }

    const itemMatch = trimmedLine.match(LIST_ITEM_PATTERN);
    if (itemMatch) {
      if (!currentSection) {
        currentSection = createFallbackSection();
        currentEntry.sections.push(currentSection);
      }
      currentSection.items.push(itemMatch[1]);
      continue;
    }

    if (/^\s{2,}\S/.test(line) && currentSection?.items.length) {
      const lastItemIndex = currentSection.items.length - 1;
      currentSection.items[lastItemIndex] = `${currentSection.items[lastItemIndex]} ${trimmedLine}`;
    }
  }

  if (entries.length < limit) {
    pushEntry();
  }

  return entries.slice(0, limit);
};

export const APP_CHANGELOG_ENTRIES = parseChangelog(APP_CHANGELOG_MARKDOWN);
