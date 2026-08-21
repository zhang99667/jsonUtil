import { describe, expect, it } from 'vitest';
import type { ArrayLocation, SchemeLocation } from './schemeScanner';
import { isSchemeScanWorkerResponse } from './schemeScanWorker';

const schemeLocation: SchemeLocation = {
  path: '$.url',
  pointer: '/url',
  line: 1,
  column: 8,
  endLine: 1,
  endColumn: 22,
  value: 'sampleapp://open',
  schemeType: 'url',
};

const arrayLocation: ArrayLocation = {
  path: '$.items',
  pointer: '/items',
  line: 2,
  column: 12,
  itemCount: 2,
};

const validResponse = {
  id: 1,
  locations: [schemeLocation],
  arrayLocations: [arrayLocation],
  isLimited: false,
  limit: 1000,
  isArrayLimited: false,
  arrayLimit: 1000,
};

describe('isSchemeScanWorkerResponse', () => {
  it('接受完整且有界的数组扫描结果', () => {
    expect(isSchemeScanWorkerResponse(validResponse)).toBe(true);
  });

  it.each([
    ['缺少数组位置', { arrayLocations: undefined }],
    ['数组路径非字符串', { arrayLocations: [{ ...arrayLocation, path: 1 }] }],
    ['数组行号越界', { arrayLocations: [{ ...arrayLocation, line: 0 }] }],
    ['数组列号非整数', { arrayLocations: [{ ...arrayLocation, column: 1.5 }] }],
    ['数组项数不足两项', { arrayLocations: [{ ...arrayLocation, itemCount: 1 }] }],
    ['数组项数超出上限', { arrayLimit: 1, arrayLocations: [arrayLocation, arrayLocation] }],
    ['数组截断标记非布尔值', { isArrayLimited: 'false' }],
    ['数组上限不是正整数', { arrayLimit: 0 }],
  ])('拒绝%s', (_label, override) => {
    expect(isSchemeScanWorkerResponse({ ...validResponse, ...override })).toBe(false);
  });

  it('只接受空结果的受控 Worker 错误响应', () => {
    expect(isSchemeScanWorkerResponse({
      id: 1,
      locations: [],
      arrayLocations: [],
      isLimited: false,
      limit: 0,
      isArrayLimited: false,
      arrayLimit: 0,
      error: '扫描失败',
    })).toBe(true);
    expect(isSchemeScanWorkerResponse({
      ...validResponse,
      error: '扫描失败',
    })).toBe(false);
  });
});
