import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

test('AI 治理 ISO 日期 helper 接受真实日历日期', () => {
  assert.equal(isIsoCalendarDate('2026-07-09'), true);
  assert.equal(isIsoCalendarDate('2024-02-29'), true);
});

test('AI 治理 ISO 日期 helper 拒绝伪日期和非标准格式', () => {
  [
    '2026-02-29',
    '2026-02-31',
    '2026-04-31',
    '2026-13-01',
    '2026-00-01',
    '2026-07-00',
    '2026/07/09',
  ].forEach(value => assert.equal(isIsoCalendarDate(value), false, value));
});
