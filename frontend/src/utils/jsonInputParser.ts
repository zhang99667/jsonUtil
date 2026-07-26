import type { JsonInputWrapper, JsonValue } from '../types.ts';
import { tryParseJsonValue } from './jsonValueGuards.ts';

export interface ParsedJsonInput {
  value: JsonValue;
  source: string;
  wrapper?: JsonInputWrapper;
}

interface WrappedJsonCandidate {
  payload: string;
  wrapper: JsonInputWrapper;
}

type WrappedJsonCandidateExtractor = (input: string) => WrappedJsonCandidate | null;

export const parseJsonCandidate = (candidate: string): ParsedJsonInput | null => {
  const value = tryParseJsonValue(candidate);
  return value === undefined ? null : { value, source: candidate };
};

const extractMarkdownJsonFenceCandidate: WrappedJsonCandidateExtractor = input => {
  const match = input.match(/^(```(?:json|jsonc)?[^\n]*\n?)([\s\S]*?)(\n?```)$/i);
  return match
    ? {
        payload: match[2].trim(),
        wrapper: { prefix: match[1], suffix: match[3] },
      }
    : null;
};

const extractAssignmentJsonCandidate: WrappedJsonCandidateExtractor = input => {
  const exportDefaultMatch = input.match(/^(export\s+default\s+)([\s\S]*?)(;?)$/);
  if (exportDefaultMatch) {
    return {
      payload: exportDefaultMatch[2].trim(),
      wrapper: { prefix: exportDefaultMatch[1], suffix: exportDefaultMatch[3] },
    };
  }

  const assignmentMatch = input.match(/^((?:(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:\s*:\s*[^=]+)?|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*)([\s\S]*?)(;?)$/);
  return assignmentMatch
    ? {
        payload: assignmentMatch[2].trim(),
        wrapper: { prefix: assignmentMatch[1], suffix: assignmentMatch[3] },
      }
    : null;
};

const extractJsonpCandidate: WrappedJsonCandidateExtractor = input => {
  const match = input.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\(\s*)([\s\S]*?)(\s*\);?)$/);
  return match
    ? {
        payload: match[2].trim(),
        wrapper: { prefix: match[1], suffix: match[3] },
      }
    : null;
};

const extractXssiJsonCandidate: WrappedJsonCandidateExtractor = input => {
  const statementMatch = input.match(/^((?:while\s*\(\s*1\s*\)|for\s*\(\s*;\s*;\s*\))\s*;\s*)([\s\S]+)$/);
  if (statementMatch) {
    return {
      payload: statementMatch[2].trim(),
      wrapper: { prefix: statementMatch[1], suffix: '' },
    };
  }

  const angularMatch = input.match(/^(\)\]\}',?\s*)([\s\S]+)$/);
  return angularMatch
    ? {
        payload: angularMatch[2].trim(),
        wrapper: { prefix: angularMatch[1], suffix: '' },
      }
    : null;
};

const WRAPPED_JSON_CANDIDATE_EXTRACTORS: readonly WrappedJsonCandidateExtractor[] = [
  extractMarkdownJsonFenceCandidate,
  extractAssignmentJsonCandidate,
  extractJsonpCandidate,
  extractXssiJsonCandidate,
];

export const parseWrappedJsonInput = (input: string): ParsedJsonInput | null => {
  const trimmed = input.trim();
  for (const extractCandidate of WRAPPED_JSON_CANDIDATE_EXTRACTORS) {
    const candidate = extractCandidate(trimmed);
    if (!candidate) continue;
    const parsed = parseJsonCandidate(candidate.payload);
    if (parsed) return { ...parsed, wrapper: candidate.wrapper };
  }
  return null;
};

export const parseJsonInput = (input: string): ParsedJsonInput | null => (
  parseJsonCandidate(input) || parseWrappedJsonInput(input)
);

export const wrapJsonContent = (content: string, wrapper: JsonInputWrapper): string => (
  `${wrapper.prefix}${content}${wrapper.suffix}`
);
