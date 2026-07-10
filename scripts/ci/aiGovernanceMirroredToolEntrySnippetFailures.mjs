export const collectMirroredSnippetFailures = (files, snippets, readFile) => files.flatMap((file) => {
  const content = readFile(file);
  if (content === null) return [];

  return snippets
    .filter(snippet => !content.includes(snippet))
    .map(snippet => `${file}: 缺少同源入口片段 "${snippet}"`);
});
