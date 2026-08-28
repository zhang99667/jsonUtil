import { readEvolutionJsonlSource } from './aiGovernanceEvolutionJsonlSource.mjs';

export const AI_EVOLUTION_FEEDBACK_INBOX_MAX_BYTES = 4 * 1024 * 1024;
export const AI_EVOLUTION_FEEDBACK_MAX_LINE_BYTES = 64 * 1024;
export const AI_EVOLUTION_FEEDBACK_MAX_PHYSICAL_LINES = 4096;
export const AI_EVOLUTION_FEEDBACK_MAX_RECORDS = 2048;

const failedSource = failure => ({
  entries: [], failures: [failure], fatal: true,
});

const parseSourceLines = (lines) => {
  const entries = [];
  const failures = [];
  lines.forEach(({ line, lineNumber, ordinal }) => {
    try {
      const event = JSON.parse(line);
      let canonical;
      try { canonical = JSON.stringify(event); }
      catch {
        entries.push({ event: null, parsed: false, line, lineNumber, ordinal });
        failures.push(`feedback-inbox.jsonl: 第 ${lineNumber} 行结构超过支持范围`);
        return;
      }
      entries.push({ event, parsed: true, line, lineNumber, ordinal });
      if (line !== canonical) failures.push(`feedback-inbox.jsonl: 第 ${lineNumber} 行必须是精确紧凑 JSON`);
    } catch {
      entries.push({ event: null, parsed: false, line, lineNumber, ordinal });
      failures.push(`feedback-inbox.jsonl: 第 ${lineNumber} 行不是合法 JSON`);
    }
  });
  return { entries, failures, fatal: false };
};

export const readEvolutionFeedbackSource = (filePath) => {
  const source = readEvolutionJsonlSource(filePath, {
    label: 'feedback-inbox.jsonl',
    maxBytes: AI_EVOLUTION_FEEDBACK_INBOX_MAX_BYTES,
    maxLineBytes: AI_EVOLUTION_FEEDBACK_MAX_LINE_BYTES,
    maxPhysicalLines: AI_EVOLUTION_FEEDBACK_MAX_PHYSICAL_LINES,
    maxRecords: AI_EVOLUTION_FEEDBACK_MAX_RECORDS,
  });
  return source.failure ? failedSource(source.failure) : parseSourceLines(source.lines);
};
