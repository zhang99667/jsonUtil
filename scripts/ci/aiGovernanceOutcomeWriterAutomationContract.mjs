const OUTCOME_WRITERS = [
  'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs',
  'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs',
  'scripts/ci/record-ai-evolution-paired-outcome.mjs',
];
const OUTCOME_WRITE_ARGUMENT = /(?:^|[\s"'`;&|()])--write(?=$|[\s"'`\\;&|()])/m;
const normalizeStaticShellFragments = command => command.replace(/\\([^\r\n])/g, '$1').replace(/["']/g, '');

export const collectOutcomeWriterAutomationWriteFailures = (commandBlocks, file) => (
  commandBlocks.some((block) => {
    const normalized = normalizeStaticShellFragments(block);
    return OUTCOME_WRITERS.some(writer => normalized.includes(writer))
      && OUTCOME_WRITE_ARGUMENT.test(normalized);
  })
    ? [`${file}: CI/workflow/local-ci 禁止 outcome writer --write`]
    : []
);
