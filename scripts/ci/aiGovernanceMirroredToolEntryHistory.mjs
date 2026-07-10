const THIN_ENTRY_HISTORY_HEADINGS = ['## 更新记录', '## 变更记录', '## Changelog', '## CHANGELOG'];

export const collectThinEntryHistoryFailures = (files, readFile) => files.flatMap((file) => {
  const content = readFile(file);
  return content === null ? [] : THIN_ENTRY_HISTORY_HEADINGS
    .filter(heading => content.includes(heading))
    .map(heading => `${file}: 工具薄入口不应维护独立更新记录 "${heading}"，请使用 docs/AI-GOVERNANCE-DECISIONS.md 和 CHANGELOG.md`);
});
