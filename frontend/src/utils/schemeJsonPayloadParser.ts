import {
  normalizeHtmlJsonQuoteCandidate,
  normalizeJsonEscapedQuoteCandidate,
  normalizeLooseJsonCandidate,
} from './schemeJsonPayloadNormalizers';
import { tryParseJsonValue } from './jsonValueGuards';
import type {
  JsonParseMeta,
  JsonParseStrategy,
  SchemeJsonPayloadValue,
} from './schemeJsonPayloadTypes';

const parseJsonCandidateWithMeta = (candidate: string, strategy: JsonParseStrategy): JsonParseMeta | null => {
  const value = tryParseJsonValue(candidate);
  return value === undefined ? null : { value, strategy, normalized: candidate };
};

export const tryParseJsonStringLiteral = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) return null;

  const parsed = tryParseJsonValue(trimmed);
  return typeof parsed === 'string' ? parsed : null;
};

export const tryParseJsonWithMeta = (value: string): JsonParseMeta | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  const strictMeta = parseJsonCandidateWithMeta(trimmed, 'strict');
  if (strictMeta) return strictMeta;

  const candidates: Array<{ value: string | null; strategy: JsonParseStrategy }> = [
    { value: normalizeHtmlJsonQuoteCandidate(trimmed), strategy: 'html-quote' },
    { value: normalizeJsonEscapedQuoteCandidate(trimmed), strategy: 'escaped-quote' },
    { value: normalizeLooseJsonCandidate(trimmed), strategy: 'loose-json' },
  ];

  for (const candidate of candidates) {
    if (!candidate.value) continue;

    const candidateMeta = parseJsonCandidateWithMeta(candidate.value, candidate.strategy);
    if (candidateMeta) return candidateMeta;

    const looseCandidate = normalizeLooseJsonCandidate(candidate.value);
    if (!looseCandidate) continue;

    const looseMeta = parseJsonCandidateWithMeta(looseCandidate, 'loose-json');
    if (looseMeta) return looseMeta;
  }

  return null;
};

export const tryParseJson = (value: string): SchemeJsonPayloadValue | null => {
  const parsed = tryParseJsonWithMeta(value);
  return parsed ? parsed.value : null;
};
