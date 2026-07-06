import { describe, expect, it } from 'vitest';
import type { SchemeDecodeWarning } from '../utils/schemeTypes';
import { collectText, findByTour } from './componentElementTestHelpers';
import { SchemeViewerDecodeWarningsPanel } from './SchemeViewerDecodeWarningsPanel';

const decodeWarnings: SchemeDecodeWarning[] = [{
  type: 'json_string_decode_skipped',
  message: '部分字符串过长，已跳过递归解析',
  skippedCount: 2,
  decodedStringCount: 3,
  totalStringLength: 2048,
  limit: 1024,
  paths: ['$.large'],
}];

describe('SchemeViewerDecodeWarningsPanel', () => {
  it('没有警告时不渲染', () => {
    expect(SchemeViewerDecodeWarningsPanel({ decodeWarnings: [] })).toBeNull();
  });

  it('渲染性能护栏提示和路径', () => {
    const tree = SchemeViewerDecodeWarningsPanel({ decodeWarnings });
    const text = collectText(tree);

    expect(findByTour(tree, 'scheme-decode-warnings')).toHaveLength(1);
    expect(text).toContain('性能保护 · 跳过 2');
    expect(text).toContain('部分字符串过长，已跳过递归解析');
    expect(text).toContain('$.large');
  });
});
