import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { collectCmdHandlerCommandSchemaRows } from './schemeMetadata';

describe('collectCmdHandlerCommandSchemaRows 深层遍历', () => {
  it('稳定收集七千层对象数组混合链的命令 Schema', () => {
    const commandSource = 'sampleapp://v1/open?id=target';
    let value: JsonValue = { convert_cmd: { id: 'target' } };
    let source = `{"convert_cmd":${JSON.stringify(commandSource)}}`;
    for (let depth = 0; depth < 7_000; depth += 1) {
      value = depth % 2 === 0 ? { child: value } : [value];
      source = depth % 2 === 0 ? `{"child":${source}}` : `[${source}]`;
    }

    const rows = collectCmdHandlerCommandSchemaRows(value, source);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      schema: 'sampleapp://v1/open',
      source: commandSource,
    });
    expect(rows[0]?.path.length).toBeGreaterThan(7_000);
  });
});
