import { describe, expect, it } from 'vitest';
import {
  getJsonPathResultFocusIndex,
  getJsonPathResultNavigationIndex,
} from './jsonPathPanelNavigation';

describe('jsonPathPanelNavigation', () => {
  it('在查询结果之间向后循环', () => {
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 0,
      resultCount: 3,
      direction: 'next',
    })).toBe(1);
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 2,
      resultCount: 3,
      direction: 'next',
    })).toBe(0);
  });

  it('在查询结果之间向前循环', () => {
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 2,
      resultCount: 3,
      direction: 'previous',
    })).toBe(1);
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 0,
      resultCount: 3,
      direction: 'previous',
    })).toBe(2);
  });

  it('没有结果或查询中时不移动光标', () => {
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 0,
      resultCount: 0,
      direction: 'next',
    })).toBeNull();
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 0,
      resultCount: 3,
      direction: 'next',
      isDisabled: true,
    })).toBeNull();
  });

  it('异常当前索引回退到第一个结果后再导航', () => {
    expect(getJsonPathResultNavigationIndex({
      currentIndex: 99,
      resultCount: 3,
      direction: 'next',
    })).toBe(1);
    expect(getJsonPathResultNavigationIndex({
      currentIndex: -1,
      resultCount: 3,
      direction: 'previous',
    })).toBe(2);
  });

  it('只允许聚焦有效结果', () => {
    expect(getJsonPathResultFocusIndex(1, 3)).toBe(1);
    expect(getJsonPathResultFocusIndex(-1, 3)).toBeNull();
    expect(getJsonPathResultFocusIndex(3, 3)).toBeNull();
    expect(getJsonPathResultFocusIndex(1, 3, true)).toBeNull();
  });
});
