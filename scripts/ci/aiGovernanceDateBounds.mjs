import { isIsoCalendarDate } from './aiGovernanceIsoDate.mjs';

const pad2 = value => String(value).padStart(2, '0');

export const getLocalIsoDate = (date = new Date()) => [
  date.getFullYear(),
  pad2(date.getMonth() + 1),
  pad2(date.getDate()),
].join('-');

export const collectFutureIsoDateFailures = (
  label,
  fieldName,
  value,
  maxDate = getLocalIsoDate()
) => (
  isIsoCalendarDate(value) && value > maxDate
    ? [`${label} ${fieldName}不能晚于当前日期，实际 \`${value}\``]
    : []
);
