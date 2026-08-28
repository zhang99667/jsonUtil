export const collectGithubWorkflowJobBlocks = (content) => {
  const jobsMatch = /^jobs:\s*$/m.exec(content);
  if (!jobsMatch) return new Map();
  const jobs = content.slice(jobsMatch.index + jobsMatch[0].length);
  const headers = [...jobs.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)];
  return new Map(headers.map((header, index) => [
    header[1],
    jobs.slice(header.index, headers[index + 1]?.index ?? jobs.length),
  ]));
};

export const collectGithubWorkflowStepBlocks = (block) => {
  const headers = [...block.matchAll(/^      -[^\n]*$/gm)];
  return headers.map((header, index) => (
    block.slice(header.index, headers[index + 1]?.index ?? block.length)
  ));
};
