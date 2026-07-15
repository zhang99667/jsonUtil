import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseUniqueJsonAuthority } from './aiGovernanceJsonAuthority.mjs';

test('JSON authority 允许不同对象重用 key 且不误判字符串语法', () => {
  const source = String.raw`{"left":{"name":"a"},"right":{"name":"b"},"text":"{\"name\":1},[,]"}`;
  assert.deepEqual(parseUniqueJsonAuthority(source), {
    left: { name: 'a' }, right: { name: 'b' }, text: '{"name":1},[,]',
  });
});

test('JSON authority 拒绝顶层、嵌套和 Unicode 转义等价重复 key', () => {
  for (const source of [
    '{"name":1,"name":2}',
    '{"outer":{"name":1,"name":2}}',
    '{"name":1,"\\u006eame":2}',
  ]) assert.throws(() => parseUniqueJsonAuthority(source), /重复 authority/);
});

test('JSON authority 拒绝非法 UTF-8、BOM、非文本与非法 JSON', () => {
  for (const source of [Buffer.from([0x80]), Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), 7, '{']) {
    assert.throws(() => parseUniqueJsonAuthority(source));
  }
});
