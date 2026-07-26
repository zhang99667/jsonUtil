import { describe, expect, it } from 'vitest';
import type { PathTransformRecord, TransformStep } from '../types';
import {
  getTransformDecodedPreview,
  getTransformDecodedValue,
  getTransformJsonParseDecodedPreview,
  getTransformJsonParseDecodedValue,
  getTransformSchemeDecodedPreview,
  getTransformSchemeDecodedValue,
} from './transformReportDecodedValue';

const createRecord = (
  originalValue: string,
  steps: TransformStep[]
): PathTransformRecord => ({
  path: '$.payload',
  originalValue,
  steps,
});

describe('transformReportDecodedValue', () => {
  it('优先使用最后一次 scheme 解码值和预览', () => {
    const steps: TransformStep[] = [
      { type: 'scheme_decode', decodedSchemeValue: { first: true } },
      { type: 'json_parse' },
      { type: 'scheme_decode', decodedSchemeValue: { final: 1 } },
    ];
    const record = createRecord('{"json":true}', steps);

    expect(getTransformSchemeDecodedValue(steps)).toEqual({ final: 1 });
    expect(getTransformSchemeDecodedPreview(steps)).toBe('对象: final');
    expect(getTransformDecodedValue(record)).toEqual({ final: 1 });
    expect(getTransformDecodedPreview(record)).toBe('对象: final');
  });

  it('scheme 解码值为 null 时不会回退到 JSON parse', () => {
    const record = createRecord('{"json":true}', [
      { type: 'json_parse' },
      { type: 'scheme_decode', decodedSchemeValue: null },
    ]);

    expect(getTransformDecodedValue(record)).toBeNull();
    expect(getTransformDecodedPreview(record)).toBe('null');
  });

  it('报告移除协议头展示字段且不修改转换上下文', () => {
    const decodedSchemeValue = {
      __scheme__: 'sampleapp://v1/browser/open',
      payload: { id: 1 },
    };
    const steps: TransformStep[] = [{
      type: 'scheme_decode',
      decodedSchemeValue,
      schemeDisplayHeaders: [{
        path: '',
        headerKey: '__scheme__',
        header: 'sampleapp://v1/browser/open',
        source: 'sampleapp://v1/browser/open?payload=%7B%22id%22%3A1%7D',
        layers: [],
        displayValueSnapshot: JSON.stringify(decodedSchemeValue),
      }],
    }];

    expect(getTransformSchemeDecodedValue(steps)).toEqual({
      payload: { id: 1 },
    });
    expect(decodedSchemeValue).toEqual({
      __scheme__: 'sampleapp://v1/browser/open',
      payload: { id: 1 },
    });
  });

  it('没有 scheme 解码值时使用 JSON parse 结果', () => {
    const record = createRecord('{"nested":{"ok":true}}', [{ type: 'json_parse' }]);

    expect(getTransformJsonParseDecodedValue(record)).toEqual({ nested: { ok: true } });
    expect(getTransformJsonParseDecodedPreview(record)).toBe('对象: nested');
    expect(getTransformDecodedValue(record)).toEqual({ nested: { ok: true } });
    expect(getTransformDecodedPreview(record)).toBe('对象: nested');
  });

  it('没有可用解码步骤或 JSON 损坏时返回 undefined', () => {
    expect(getTransformDecodedValue(createRecord('{"broken"', []))).toBeUndefined();
    expect(getTransformDecodedValue(createRecord('{"broken"', [{ type: 'json_parse' }]))).toBeUndefined();
    expect(getTransformDecodedPreview(createRecord('{"broken"', [{ type: 'json_parse' }]))).toBeUndefined();
  });
});
