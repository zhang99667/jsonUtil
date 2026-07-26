import { describe, expect, it } from 'vitest';
import { formatPrimaryCmdHandlerCompatibleResult } from './schemeMetadata';

describe('formatPrimaryCmdHandlerCompatibleResult 深层遍历', () => {
  it('稳定识别七千层对象数组混合链的主命令', () => {
    const commandSource = 'sampleapp://v1/open?id=target';
    let decoded = '{"convert_cmd":{"id":"target"}}';
    let source = `{"convert_cmd":${JSON.stringify(commandSource)}}`;
    for (let depth = 0; depth < 7_000; depth += 1) {
      decoded = depth % 2 === 0 ? `{"child":${decoded}}` : `[${decoded}]`;
      source = depth % 2 === 0 ? `{"child":${source}}` : `[${source}]`;
    }

    const result = JSON.parse(formatPrimaryCmdHandlerCompatibleResult(decoded, undefined, source));

    expect(result.result).toEqual({
      cmdSchema: 'sampleapp://v1/open',
      cmdParams: { id: 'target' },
      source: commandSource,
    });
  });
});
