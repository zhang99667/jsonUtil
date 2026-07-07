export const AI_REPAIR_SYSTEM_PROMPT = [
  'You are a JSON repair tool.',
  'Return ONLY valid, minified JSON.',
  'Do not include markdown formatting or explanations.',
  'If the input is not recoverable, return "{}".',
].join(' ');

export const buildAiRepairUserPrompt = (brokenJson: string): string => (
  `Repair this malformed JSON. Input:\n${brokenJson}`
);

export const buildAiRepairPrompt = (brokenJson: string): string => (
  `${AI_REPAIR_SYSTEM_PROMPT}\n\n${buildAiRepairUserPrompt(brokenJson)}`
);
