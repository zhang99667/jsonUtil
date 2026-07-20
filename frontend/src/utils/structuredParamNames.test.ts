import { describe, expect, it } from 'vitest';
import {
  isKnownDecodableParamName,
  isLikelyStructuredFieldName,
  normalizeCmdParamName,
} from './structuredParamNames';

describe('structuredParamNames', () => {
  it('归一化 CMD 参数名别名', () => {
    expect(normalizeCmdParamName('action-command')).toBe('actioncommand');
    expect(normalizeCmdParamName('toolbar_icons')).toBe('toolbaricons');
    expect(isKnownDecodableParamName('toolbaricons')).toBe(true);
    expect(isKnownDecodableParamName('bottomButtonScheme')).toBe(true);
  });

  it('识别结构化字段后缀', () => {
    expect(isLikelyStructuredFieldName('jump_url')).toBe(true);
    expect(isLikelyStructuredFieldName('landingUrl')).toBe(true);
    expect(isLikelyStructuredFieldName('trackingInfo')).toBe(true);
    expect(isLikelyStructuredFieldName('task-policy')).toBe(true);
    expect(isLikelyStructuredFieldName('sync_data')).toBe(true);
    expect(isLikelyStructuredFieldName('sessionData')).toBe(true);
  });

  it('避免普通字段误判为可解码参数', () => {
    expect(isKnownDecodableParamName('name')).toBe(false);
    expect(isKnownDecodableParamName('status')).toBe(false);
    expect(isLikelyStructuredFieldName('urlish')).toBe(false);
    expect(isLikelyStructuredFieldName('information')).toBe(false);
    expect(isLikelyStructuredFieldName('metadata')).toBe(false);
  });
});
