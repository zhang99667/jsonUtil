import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

const pad2 = value => String(value).padStart(2, '0');
const MAX_GLOBAL_UTC_OFFSET_MS = 14 * 60 * 60 * 1000;

export const getLocalIsoDate = (date = new Date()) => [
  date.getFullYear(),
  pad2(date.getMonth() + 1),
  pad2(date.getDate()),
].join('-');

export const getLatestGlobalIsoDate = (date = new Date()) =>
  new Date(date.getTime() + MAX_GLOBAL_UTC_OFFSET_MS).toISOString().slice(0, 10);

export const collectFutureIsoDateFailures = (
  label,
  fieldName,
  value,
  maxDate = getLatestGlobalIsoDate()
) => (
  isIsoCalendarDate(value) && value > maxDate
    ? [`${label} ${fieldName}不能晚于当前日期，实际 \`${value}\``]
    : []
);
