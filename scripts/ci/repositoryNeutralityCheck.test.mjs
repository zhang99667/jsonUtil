import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findRestrictedMarkerIndex,
  RESTRICTED_MARKERS,
} from './repositoryNeutralityCheck.mjs';

test('仓库中立性检查接受中性的项目内容', () => {
  assert.equal(findRestrictedMarkerIndex('JSONUtils project assets'), -1);
});

test('仓库中立性检查拒绝每个已登记标识', () => {
  RESTRICTED_MARKERS.forEach((marker, index) => {
    assert.equal(findRestrictedMarkerIndex(`prefix-${marker}-suffix`), index);
    assert.equal(findRestrictedMarkerIndex(marker.toUpperCase()), index);
  });
});

test('仓库中立性检查拒绝被文本分块切开的标识', () => {
  const marker = RESTRICTED_MARKERS[3];
  const midpoint = Math.floor(marker.length / 2);
  const chunked = `${marker.slice(0, midpoint)}",\n  "${marker.slice(midpoint)}`;
  assert.equal(findRestrictedMarkerIndex(chunked), 3);
});
