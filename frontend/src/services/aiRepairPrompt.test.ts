import { describe, expect, it } from 'vitest';
import {
  AI_REPAIR_SYSTEM_PROMPT,
  buildAiRepairPrompt,
  buildAiRepairUserPrompt,
} from './aiRepairPrompt';

describe('aiRepairPrompt', () => {
  it('系统 prompt 固定 JSON 修复输出契约', () => {
    expect(AI_REPAIR_SYSTEM_PROMPT).toContain('JSON repair tool');
    expect(AI_REPAIR_SYSTEM_PROMPT).toContain('Return ONLY valid, minified JSON');
    expect(AI_REPAIR_SYSTEM_PROMPT).toContain('Do not include markdown formatting or explanations');
    expect(AI_REPAIR_SYSTEM_PROMPT).toContain('return "{}"');
  });

  it('用户 prompt 只拼接待修复原文', () => {
    expect(buildAiRepairUserPrompt('{bad:}')).toBe(
      'Repair this malformed JSON. Input:\n{bad:}'
    );
  });

  it('完整 prompt 同时包含系统契约和输入原文', () => {
    const prompt = buildAiRepairPrompt('{bad:}');

    expect(prompt).toContain(AI_REPAIR_SYSTEM_PROMPT);
    expect(prompt).toContain('Repair this malformed JSON. Input:\n{bad:}');
  });
});
