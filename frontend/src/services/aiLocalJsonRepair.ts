import { jsonrepair } from 'jsonrepair';
import { tryNormalizeJson } from './aiRepairResponseNormalizer';
import { canRepairJsonLocally } from './aiLocalJsonRepairPolicy';

export interface LocalJsonRepairReport {
  fixedJson: string;
  ruleLabels: string[];
}

const NORMALIZED_JSON_RULE_LABEL = '规范化 JSON';
const REPAIRED_JSON_RULE_LABEL = '修正非标准 JSON 语法';

/**
 * 对常见 JSON 语法错误做纯本地修复，能修好时避免把原文发送给模型。
 */
export const repairJsonLocally = (input: string): string | null => (
  repairJsonLocallyWithReport(input)?.fixedJson ?? null
);

export const repairJsonLocallyWithReport = (input: string): LocalJsonRepairReport | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = tryNormalizeJson(trimmed);
  if (normalized) {
    return {
      fixedJson: normalized,
      ruleLabels: [NORMALIZED_JSON_RULE_LABEL],
    };
  }

  if (!canRepairJsonLocally(trimmed)) return null;

  try {
    const repaired = tryNormalizeJson(jsonrepair(trimmed));
    return repaired
      ? {
        fixedJson: repaired,
        ruleLabels: [REPAIRED_JSON_RULE_LABEL],
      }
      : null;
  } catch {
    return null;
  }
};
