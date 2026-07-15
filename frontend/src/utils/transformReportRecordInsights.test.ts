import { describe, expect, it } from 'vitest';
import type { JsonValue, PathTransformRecord, TransformStep } from '../types';
import {
  DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT,
  buildTransformRecordInsightData,
} from './transformReportRecordInsights';

const createSchemeRecord = (
  originalValue: string,
  decodedSchemeValue: JsonValue,
  path = '$.scheme'
): PathTransformRecord => ({
  path,
  originalValue,
  steps: [
    {
      type: 'scheme_decode',
      originalSchemeType: 'url',
      originalScheme: originalValue,
      decodedSchemeValue,
    } satisfies TransformStep,
  ],
});

describe('transformReportRecordInsights', () => {
  it('非对象解码值只保留 commandSchema 洞察', () => {
    const source = 'sampleapp://v7/vendor/ad/deeplink?params=%7B%7D';
    const result = buildTransformRecordInsightData(createSchemeRecord(source, 'plain'));

    expect(result).toMatchObject({
      insights: ['cmdSchema: sampleapp://v7/vendor/ad/deeplink'],
      nestedCommandFields: [],
      indexedNestedCommandFieldCount: 0,
      hasMoreNestedCommandFields: false,
      nestedResourceFields: [],
      indexedNestedResourceFieldCount: 0,
      hasMoreNestedResourceFields: false,
      nestedCommandFieldCount: 0,
      nestedResourceFieldCount: 0,
      nestedExtFieldCount: 0,
      nestedBase64SuffixFieldCount: 0,
    });
    expect(result.nestedCommandSearchFields).toBeUndefined();
    expect(result.nestedResourceSearchFields).toBeUndefined();
  });

  it('构建内部 CMD、资源 URL、ext 和 Base64 后缀洞察', () => {
    const source = 'samplevendor://vendor/ad/rewardImpl?video_info=%7B%7D';
    const result = buildTransformRecordInsightData(createSchemeRecord(source, {
      video_info: {
        page_url: { params: { sku: '101' } },
        video_url: 'https://static.example.com/video/ad.mp4?pd=100',
        button_icon: 'https://static.example.com/assets/open.png',
        ext_info: { user_id: 'u1' },
        _base64_suffix_decoded: { ext: true, trace: 't1' },
      },
    }));

    expect(result.insights).toEqual([
      'cmdSchema: samplevendor://vendor/ad/rewardImpl',
      'cmd解析: page_url',
      '资源URL: video_url, button_icon',
      'ext解析: ext_info',
      'Base64 后缀: ext, trace',
    ]);
    expect(result.nestedCommandFieldCount).toBe(1);
    expect(result.nestedCommandFields).toEqual([
      {
        path: '$.scheme.video_info.page_url',
        preview: '对象: params',
        value: { params: { sku: '101' } },
      },
    ]);
    expect(result.nestedResourceFieldCount).toBe(2);
    expect(result.nestedResourceFields).toEqual([
      {
        path: '$.scheme.video_info.video_url',
        preview: 'https://static.example.com/video/ad.mp4?pd=100',
        value: 'https://static.example.com/video/ad.mp4?pd=100',
        resourceType: 'video',
        resourceTypeLabel: '视频',
      },
      {
        path: '$.scheme.video_info.button_icon',
        preview: 'https://static.example.com/assets/open.png',
        value: 'https://static.example.com/assets/open.png',
        resourceType: 'image',
        resourceTypeLabel: '图片',
      },
    ]);
    expect(result.nestedExtFieldCount).toBe(1);
    expect(result.nestedBase64SuffixFieldCount).toBe(2);
  });

  it('搜索字段保留 200 条索引并按展示上限截断', () => {
    const decodedSchemeValue = {
      payload: Object.fromEntries(Array.from({ length: 210 }, (_, index) => [
        `field_${index}_cmd`,
        { params: { id: index } },
      ])),
    };
    const result = buildTransformRecordInsightData(createSchemeRecord('cmd://open?params=%7B%7D', decodedSchemeValue));

    expect(result.nestedCommandFieldCount).toBe(210);
    expect(result.indexedNestedCommandFieldCount).toBe(200);
    expect(result.nestedCommandFields).toHaveLength(DEFAULT_TRANSFORM_RECORD_INSIGHT_FIELD_LIMIT);
    expect(result.nestedCommandSearchFields).toHaveLength(200);
    expect(result.hasMoreNestedCommandFields).toBe(true);
    expect(result.insights).toContain('cmd解析: field_0_cmd, field_1_cmd, field_2_cmd, field_3_cmd +206');
  });
});
