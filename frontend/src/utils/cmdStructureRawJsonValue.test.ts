import { describe, expect, it } from 'vitest';
import {
  toCmdStructureJsonValue,
  tryParseRawCmdJsonString,
} from './cmdStructureRawJsonValue';

describe('cmdStructureRawJsonValue', () => {
  it('解析普通 JSON 和 URL 编码 JSON 字符串', () => {
    expect(tryParseRawCmdJsonString('{"nid":123}')).toEqual({ nid: 123 });
    expect(tryParseRawCmdJsonString('%7B%22nid%22%3A123%7D')).toEqual({ nid: 123 });
  });

  it('非 JSON 形态文本不会进入 JSON 解析', () => {
    expect(tryParseRawCmdJsonString('cmd=%7B%7D')).toBeUndefined();
    expect(tryParseRawCmdJsonString('plain')).toBeUndefined();
  });

  it('将 unknown 递归转换成 JsonValue', () => {
    expect(toCmdStructureJsonValue({
      title: '按钮',
      count: 2,
      enabled: true,
      nested: [{ value: undefined }],
    })).toEqual({
      title: '按钮',
      count: 2,
      enabled: true,
      nested: [{ value: 'undefined' }],
    });
  });
});
