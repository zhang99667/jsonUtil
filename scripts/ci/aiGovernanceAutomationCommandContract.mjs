import { collectGithubWorkflowRunBlocks } from './githubWorkflowRunBlocks.mjs';

const ARTIFACT_WRITER_COMMAND = 'node scripts/ci/write-ai-governance-artifacts.mjs';
const OUTCOME_WRITERS = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
];
const OUTCOME_WRITE_ARGUMENT = /(?:^|[\s"'`;&|()])--write(?=$|[\s"'`\\;&|()])/m;
const REQUIRED_COMMAND_CONTROL_RULES = [
  {
    label: '静态 false if',
    job: /^ {4}if:\s*(?:false|\$\{\{\s*false\s*\}\})\s*(?:#.*)?$/im,
    step: /^(?: {6}-\s*| {8})if:\s*(?:false|\$\{\{\s*false\s*\}\})\s*(?:#.*)?$/im,
  },
  {
    label: 'continue-on-error: true',
    job: /^ {4}continue-on-error:\s*true\s*(?:#.*)?$/im,
    step: /^(?: {6}-\s*| {8})continue-on-error:\s*true\s*(?:#.*)?$/im,
  },
];

export const collectGithubWorkflowCommands = content => collectGithubWorkflowRunBlocks(content)
  .flatMap(block => block.content.split(/\r?\n/).map(line => line.trim()).filter(Boolean));

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
  return headers.map((header, index) => block.slice(header.index, headers[index + 1]?.index ?? block.length));
};

export const collectOutcomeWriterAutomationWriteFailures = (commandBlocks, file) => (
  commandBlocks.some(block => (
    OUTCOME_WRITERS.some(writer => block.includes(writer)) && OUTCOME_WRITE_ARGUMENT.test(block)
  ))
    ? [`${file}: CI/workflow/local-ci 禁止 outcome writer --write`]
    : []
);

export const collectRequiredWorkflowCommandReachabilityFailures = (content, requiredCommands, file) => (
  [...collectGithubWorkflowJobBlocks(content).values()]
    .flatMap(job => collectGithubWorkflowStepBlocks(job).flatMap((step) => {
      const commands = new Set(collectGithubWorkflowCommands(step));
      const violations = REQUIRED_COMMAND_CONTROL_RULES
        .filter(rule => rule.job.test(job) || rule.step.test(step));
      const failures = requiredCommands
        .filter(command => commands.has(command))
        .flatMap(command => violations.map(({ label }) => (
          `${file}: 必需治理命令 "${command}" 所在 job/step 禁止 ${label}`
        )));
      if (commands.has(ARTIFACT_WRITER_COMMAND) && (!/^(?: {6}-\s*| {8})if:[ \t]*(?:always\(\)|\$\{\{[ \t]*always\(\)[ \t]*\}\})[ \t]*(?:#.*)?$/im.test(step) || /^ {4}continue-on-error:(?![ \t]*false[ \t]*(?:#.*)?$)[^\r\n]+$/im.test(job) || /^(?: {6}-\s*| {8})continue-on-error:(?![ \t]*false[ \t]*(?:#.*)?$)[^\r\n]+$/im.test(step))) failures.push(`${file}: artifact writer 必须使用 if: always() 且不得忽略自身失败`);
      return failures;
    }))
);
