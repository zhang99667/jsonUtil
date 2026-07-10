import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

const validDates = ['2026-07-09', '2024-02-29'];
const invalidDates = ['2026-02-29', '2026-02-31', '2026-04-31', '2026-13-01', '2026-00-01', '2026-07-00', '2026/07/09'];

test('AI 治理 ISO 日期 helper 接受真实日历日期', () => {
  validDates.forEach(value => assert.equal(isIsoCalendarDate(value), true, value));
});

test('AI 治理 ISO 日期 helper 拒绝伪日期和非标准格式', () => {
  invalidDates.forEach(value => assert.equal(isIsoCalendarDate(value), false, value));
});
