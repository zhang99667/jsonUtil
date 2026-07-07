import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_FILL_TEMPLATE_KIND } from './placeholderFillTemplateContract';
import { updatePlaceholderReplacement } from './placeholderFillTemplateReplacement';

const createTemplateText = () => JSON.stringify({
  kind: PLACEHOLDER_FILL_TEMPLATE_KIND,
  placeholders: {
    __UID__: '',
    __TOKEN__: 'old-token',
    ignoredNumber: 12,
  },
  placeholderDetails: [
    {
      value: '__UID__',
      replacement: '',
      description: '用户 ID',
    },
    {
      value: '__TOKEN__',
      replacement: 'old-token',
    },
  ],
});

describe('placeholderFillTemplateReplacement', () => {
  it('更新 replacement 时同步 placeholders 和详情行', () => {
    const updated = JSON.parse(updatePlaceholderReplacement(createTemplateText(), '__UID__', '10086'));

    expect(updated.placeholders.__UID__).toBe('10086');
    expect(updated.placeholders.__TOKEN__).toBe('old-token');
    expect(updated.placeholders.ignoredNumber).toBe(12);
    expect(updated.placeholderDetails.find((detail: { value: string }) => detail.value === '__UID__')).toMatchObject({
      value: '__UID__',
      replacement: '10086',
      description: '用户 ID',
    });
  });

  it('更新未知 placeholder 时沿用当前追加策略', () => {
    const updated = JSON.parse(updatePlaceholderReplacement(createTemplateText(), '__NEW__', 'new-value'));

    expect(updated.placeholders.__NEW__).toBe('new-value');
    expect(updated.placeholderDetails.find((detail: { value: string }) => detail.value === '__NEW__')).toBeUndefined();
  });

  it('非回填模板 replacement 更新保持原文不变', () => {
    const templateText = JSON.stringify({ hello: 'world' });

    expect(updatePlaceholderReplacement(templateText, '__UID__', '10086')).toBe(templateText);
  });
});
