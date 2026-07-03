import React from 'react';
import { describe, expect, it } from 'vitest';
import { buildIndexedMoreContent } from './transformReportRecordPathMoreContent';

interface ElementLike {
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(node.props.children);
  return '';
};

describe('buildIndexedMoreContent', () => {
  it('无需展示更多提示时返回空内容', () => {
    expect(buildIndexedMoreContent(false, '还有更多内部路径未展示', 3, 1, '条')).toBeUndefined();
  });

  it('展示 lead 内容和额外索引数量', () => {
    const content = buildIndexedMoreContent(
      true,
      '还有更多内部 CMD 字段未展示',
      3,
      1,
      '个，可搜索字段名或 schema 展示隐藏项'
    );

    expect(collectText(content)).toBe('还有更多内部 CMD 字段未展示，已索引 3 个，可搜索字段名或 schema 展示隐藏项');
  });

  it('没有额外索引数量时只展示 lead 内容', () => {
    const content = buildIndexedMoreContent(
      true,
      <>还有更多内部路径未展示，总计 2+ 条</>,
      1,
      1,
      '条，可搜索字段名展示隐藏路径'
    );

    expect(collectText(content)).toBe('还有更多内部路径未展示，总计 2+ 条');
  });
});
