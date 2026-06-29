import { describe, expect, it } from 'vitest';
import {
  classifyTransformUnresolvedCandidate,
  classifyTransformWarning,
} from './transformIssueClassification';

describe('transformIssueClassification', () => {
  it('区分 URL 编码解码失败和已解码未结构化', () => {
    expect(classifyTransformUnresolvedCandidate({
      detectedType: 'url-encoded',
      message: 'URL 解码失败',
    })).toMatchObject({
      reasonLabel: 'URL 编码解码失败',
      reasonLevel: 'warning',
    });

    expect(classifyTransformUnresolvedCandidate({
      detectedType: 'url-encoded',
      message: '已解码但不是对象',
    })).toMatchObject({
      reasonLabel: '已解码但未结构化',
      reasonLevel: 'info',
    });
  });

  it('识别疑似 CMD、URL 和 Base64 规则缺口', () => {
    expect(classifyTransformUnresolvedCandidate({
      detectedType: 'query-string',
      message: '未展开',
    })).toMatchObject({
      reasonLabel: '疑似 CMD 规则缺口',
      reasonLevel: 'warning',
    });
    expect(classifyTransformUnresolvedCandidate({
      detectedType: 'url',
      message: '未展开',
    })).toMatchObject({
      reasonLabel: '疑似 URL/Scheme 规则缺口',
      reasonLevel: 'warning',
    });
    expect(classifyTransformUnresolvedCandidate({
      detectedType: 'base64',
      message: '未展开',
    })).toMatchObject({
      reasonLabel: '疑似 Base64 非 JSON',
      reasonLevel: 'info',
    });
  });

  it('默认分类会根据 JSON 错误文案提升风险等级', () => {
    expect(classifyTransformUnresolvedCandidate({
      message: '不是有效 JSON',
    })).toMatchObject({
      reasonLabel: '待补充解析规则',
      reasonLevel: 'warning',
    });
    expect(classifyTransformUnresolvedCandidate({
      message: '未命中已知规则',
    })).toMatchObject({
      reasonLabel: '待补充解析规则',
      reasonLevel: 'info',
    });
  });

  it('区分累计预算保护和单字段长度保护', () => {
    expect(classifyTransformWarning({
      type: 'string_decode_budget_exceeded',
    })).toMatchObject({
      reasonLabel: '累计预算保护',
    });
    expect(classifyTransformWarning({
      type: 'string_decode_skipped',
    })).toMatchObject({
      reasonLabel: '单字段长度保护',
    });
  });
});
