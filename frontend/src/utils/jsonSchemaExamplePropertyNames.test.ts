import { describe, expect, it } from 'vitest';
import {
  findAvailablePropertyKey,
  getPatternPropertyKeyCandidates,
  getPropertyNameCandidates,
  isPropertyNameAllowed,
} from './jsonSchemaExamplePropertyNames';

describe('JSON Schema 动态属性名约束', () => {
  it('优先使用常量、枚举和正则推导候选', () => {
    expect(getPropertyNameCandidates({ const: 'fixed' })).toEqual(['fixed']);
    expect(getPropertyNameCandidates({ enum: ['first', 'second'] })).toEqual(['first', 'second']);
    expect(getPatternPropertyKeyCandidates('^meta_[a-z]+$', undefined)[0]).toBe('meta_key');
  });

  it('同时校验类型、长度、枚举和正则', () => {
    expect(isPropertyNameAllowed('meta_key', {
      type: 'string',
      minLength: 4,
      maxLength: 12,
      pattern: '^meta_[a-z]+$',
    })).toBe(true);
    expect(isPropertyNameAllowed('meta_key', { type: 'number' })).toBe(false);
    expect(isPropertyNameAllowed('other', { enum: ['allowed'] })).toBe(false);
    expect(isPropertyNameAllowed('x', false)).toBe(false);
  });

  it('跳过已使用和不满足约束的候选', () => {
    expect(findAvailablePropertyKey(
      ['used', 'blocked', 'available'],
      new Set(['used']),
      key => key !== 'blocked',
    )).toBe('available');
    expect(findAvailablePropertyKey(['used'], new Set(['used']), () => true)).toBeUndefined();
  });
});
