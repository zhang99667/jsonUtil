const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

export const isIsoCalendarDate = (text) => {
  if (typeof text !== 'string') return false;
  const match = ISO_DATE_PATTERN.exec(text);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const maxDay = month === 2 && isLeapYear(year) ? 29 : MONTH_DAYS[month - 1];
  return month >= 1 && month <= 12 && day >= 1 && day <= maxDay;
};
