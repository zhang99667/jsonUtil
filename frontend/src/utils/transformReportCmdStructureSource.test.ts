import { describe, expect, it } from 'vitest';
import type { JsonValue, PathTransformRecord, TransformStep } from '../types';
import {
  buildTransformCommandParamSummary,
  createTransformRecordCmdStructureCopyTextGetter,
  getTransformRecordCmdStructureSource,
  getTransformRecordCommandSchema,
} from './transformReportCmdStructureSource';

const createRecord = (
  originalValue: string,
  steps: TransformStep[],
  decodedValue?: JsonValue
): PathTransformRecord => ({
  path: '$.scheme',
  originalValue,
  steps: decodedValue === undefined
    ? steps
    : steps.map((step, index) => (
      index === steps.length - 1 ? { ...step, decodedSchemeValue: decodedValue } : step
    )),
});

describe('transformReportCmdStructureSource', () => {
  it('从 URL Scheme 记录提取 commandSchema 和结构源', () => {
    const source = 'sampleapp://v7/vendor/ad/deeplink?params=%7B%7D';
    const record = createRecord(source, [
      { type: 'scheme_decode', originalSchemeType: 'url', originalScheme: source },
    ], { cmd: { nid: 123 }, from: 'feed' });

    expect(getTransformRecordCommandSchema(record)).toBe('sampleapp://v7/vendor/ad/deeplink');
    expect(getTransformRecordCmdStructureSource(record)).toEqual({
      decodedValue: { cmd: { nid: 123 }, from: 'feed' },
      commandSchema: 'sampleapp://v7/vendor/ad/deeplink',
      source,
    });
  });

  it('query-string 记录保留结构源但不生成 commandSchema', () => {
    const source = 'cmd=%7B%22nid%22%3A123%7D&from=feed';
    const record = createRecord(source, [
      { type: 'scheme_decode', originalSchemeType: 'query-string' },
    ], { cmd: { nid: 123 }, from: 'feed' });

    expect(getTransformRecordCommandSchema(record)).toBeUndefined();
    expect(getTransformRecordCmdStructureSource(record)).toEqual({
      decodedValue: { cmd: { nid: 123 }, from: 'feed' },
      source,
    });
  });

  it('非 URL/query-string 或非对象解码值不会生成 CMD 结构源', () => {
    expect(getTransformRecordCmdStructureSource(createRecord('"plain"', [
      { type: 'json_parse' },
    ], { ok: true }))).toBeNull();
    expect(getTransformRecordCmdStructureSource(createRecord('cmd=plain', [
      { type: 'scheme_decode', originalSchemeType: 'query-string' },
    ], 'plain'))).toBeNull();
    expect(getTransformRecordCmdStructureSource(createRecord('cmd=null', [
      { type: 'scheme_decode', originalSchemeType: 'query-string' },
    ], null))).toBeNull();
  });

  it('构建命令参数顶层摘要并支持 key 上限', () => {
    expect(buildTransformCommandParamSummary({ a: 1, b: 2, c: 3 }, 2)).toEqual({
      commandParamCount: 3,
      commandParamKeys: ['a', 'b'],
    });
    expect(buildTransformCommandParamSummary(['a', 'b'])).toEqual({});
    expect(buildTransformCommandParamSummary(null)).toEqual({});
  });

  it('创建 cmdHandler 兼容复制 getter 并支持按内部路径聚焦', () => {
    const getter = createTransformRecordCmdStructureCopyTextGetter({
      decodedValue: {
        cmd: { nid: 123, title: '保留在全量复制中' },
        from: 'feed',
      },
      commandSchema: 'sampleapp://v7/vendor/ad/deeplink',
      source: 'sampleapp://v7/vendor/ad/deeplink?params=%7B%7D',
    }, '$.scheme');

    expect(JSON.parse(getter())).toEqual({
      result: {
        cmdSchema: 'sampleapp://v7/vendor/ad/deeplink',
        cmdParams: {
          cmd: { nid: 123, title: '保留在全量复制中' },
          from: 'feed',
        },
        source: 'sampleapp://v7/vendor/ad/deeplink?params=%7B%7D',
      },
    });
    expect(JSON.parse(getter(['$.scheme.cmd.nid']))).toEqual({
      result: {
        cmdSchema: 'sampleapp://v7/vendor/ad/deeplink',
        cmdParams: {
          cmd: { nid: 123 },
        },
        source: 'sampleapp://v7/vendor/ad/deeplink?params=%7B%7D',
      },
    });
  });
});
