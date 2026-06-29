import type { TransformWarning } from '../types';

export interface TransformWarningClassification {
  reasonLabel: string;
  nextAction: string;
}

export const classifyTransformWarning = (
  warning: Pick<TransformWarning, 'type'>
): TransformWarningClassification => {
  if (warning.type === 'string_decode_budget_exceeded') {
    return {
      reasonLabel: '累计预算保护',
      nextAction: '优先用 JSONPath 定位目标字段，或只复制该字段到 Scheme 面板单独解析，避免整段 response 的其它长字符串消耗预算。',
    };
  }

  return {
    reasonLabel: '单字段长度保护',
    nextAction: '该字段本身超过自动解析阈值，可复制路径定位后单独粘贴到 Scheme 面板，或缩小 response 后再深度解析。',
  };
};
