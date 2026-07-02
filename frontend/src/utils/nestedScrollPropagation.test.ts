import { describe, expect, it } from 'vitest';
import { shouldStopNestedScrollPropagation } from './nestedScrollPropagation';

describe('shouldStopNestedScrollPropagation', () => {
  it('内部可滚动时阻止滚轮冒泡到外层滚动容器', () => {
    expect(shouldStopNestedScrollPropagation(240, 120)).toBe(true);
  });

  it('内部没有滚动空间时允许外层继续滚动', () => {
    expect(shouldStopNestedScrollPropagation(120, 120)).toBe(false);
  });
});
