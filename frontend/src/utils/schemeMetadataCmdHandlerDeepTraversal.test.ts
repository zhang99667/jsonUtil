import { describe, expect, it } from 'vitest';
import { formatCmdHandlerCompatibleResult } from './schemeMetadata';

describe('formatCmdHandlerCompatibleResult 深层遍历', () => {
  it('稳定导出两千五百层对象数组混合参数', () => {
    let decoded = '{"__proto__":{"id":"target"}}';
    for (let depth = 0; depth < 2_500; depth += 1) {
      decoded = depth % 2 === 0 ? `{"child":${decoded}}` : `[${decoded}]`;
    }

    const output = formatCmdHandlerCompatibleResult(decoded, 'sampleapp://v1/open');

    expect(output).toContain('"cmdSchema": "sampleapp://v1/open"');
    expect(output).toContain('"__proto__"');
    expect(output).toContain('"id": "target"');
  });
});
