import { describe, expect, it } from 'vitest';
import {
  formatHarSourceLabel,
  formatSourceLabelText,
  getSourceLabelDisplayValue,
  getSourceLabelKindText,
  isHarSourceLabel,
  trimSourceLabel,
} from './sourceLabels';

describe('sourceLabels', () => {
  it('普通业务字段保持原文展示', () => {
    expect(trimSourceLabel('  extraParam  ')).toBe('extraParam');
    expect(isHarSourceLabel('extraParam')).toBe(false);
    expect(getSourceLabelKindText('extraParam')).toBe('业务字段');
    expect(getSourceLabelDisplayValue('extraParam')).toBe('extraParam');
    expect(formatSourceLabelText('extraParam')).toBe('业务字段: extraParam');
  });

  it('HAR 上下文展示时隐藏内部前缀', () => {
    const label = formatHarSourceLabel('POST 500 api.example.com/api/order');

    expect(label).toBe('HAR POST 500 api.example.com/api/order');
    expect(isHarSourceLabel(label)).toBe(true);
    expect(getSourceLabelKindText(label)).toBe('接口上下文');
    expect(getSourceLabelDisplayValue(label)).toBe('POST 500 api.example.com/api/order');
    expect(formatSourceLabelText(label)).toBe('接口上下文: POST 500 api.example.com/api/order');
  });
});
