const BASE_WEEK_START_ISO = '2026-01-12';
const DAYS_PER_CALENDAR_WEEK = 7;
const DAYS_PER_REPORTING_WEEK = 6;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MANILA_TIMEZONE = 'Asia/Manila';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const parseISODate = (isoDate) => {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const formatISODate = (date) => date.toISOString().slice(0, 10);

export const addDays = (date, days) => new Date(date.getTime() + days * MS_PER_DAY);

export const formatMonthDayYear = (date) => {
  const year = date.getUTCFullYear();
  const monthName = MONTH_NAMES[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${monthName} ${day}, ${year}`;
};

export const formatMMDDYYYY = (date) => {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

export const formatReportingDateRange = (startDate, endDate) => {
  const startMonthName = MONTH_NAMES[startDate.getUTCMonth()];
  const endMonthName = MONTH_NAMES[endDate.getUTCMonth()];
  const startDay = startDate.getUTCDate();
  const endDay = endDate.getUTCDate();
  const startYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();

  if (startYear === endYear && startDate.getUTCMonth() === endDate.getUTCMonth()) {
    return `${startMonthName} ${startDay} - ${endDay}, ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startMonthName} ${startDay} - ${endMonthName} ${endDay}, ${startYear}`;
  }

  return `${startMonthName} ${startDay}, ${startYear} - ${endMonthName} ${endDay}, ${endYear}`;
};

export const getBaseWeekStartDate = () => parseISODate(BASE_WEEK_START_ISO);

export const getWeekNumberForDate = (dateInput) => {
  const targetDate = typeof dateInput === 'string' ? parseISODate(dateInput) : dateInput;
  const baseDate = getBaseWeekStartDate();
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / MS_PER_DAY);

  if (diffDays < 0) {
    return 0;
  }

  return Math.floor(diffDays / DAYS_PER_CALENDAR_WEEK) + 1;
};

export const getWeekStartDateByNumber = (reportWeek) => {
  const baseDate = getBaseWeekStartDate();
  const startOffset = (Number(reportWeek) - 1) * DAYS_PER_CALENDAR_WEEK;
  return addDays(baseDate, startOffset);
};

export const getWeekEndDateByNumber = (reportWeek) => {
  const weekStartDate = getWeekStartDateByNumber(reportWeek);
  return addDays(weekStartDate, DAYS_PER_REPORTING_WEEK - 1);
};

export const getSignatoryDateByWeek = (reportWeek) => getWeekEndDateByNumber(reportWeek);

export const getWeekMetadata = (reportWeek) => {
  const weekStartDate = getWeekStartDateByNumber(reportWeek);
  const weekEndDate = getWeekEndDateByNumber(reportWeek);
  const signatoryDate = getSignatoryDateByWeek(reportWeek);

  return {
    reportWeek: Number(reportWeek),
    weekStartDate,
    weekEndDate,
    signatoryDate,
    weekStartDateISO: formatISODate(weekStartDate),
    weekEndDateISO: formatISODate(weekEndDate),
    signatoryDateISO: formatISODate(signatoryDate),
    reportingDate: formatReportingDateRange(weekStartDate, weekEndDate)
  };
};

export const getManilaISODate = (date = new Date()) => {
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return dateFormatter.format(date);
};

export const getManilaWeekday = (date = new Date()) => {
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIMEZONE,
    weekday: 'short'
  });
  return weekdayFormatter.format(date);
};

export const getCurrentWeekNumber = (date = new Date()) => {
  const manilaIsoDate = getManilaISODate(date);
  return getWeekNumberForDate(manilaIsoDate);
};

export const isSundayInManila = (date = new Date()) => getManilaWeekday(date) === 'Sun';

export const getNextWeekNumberFromSunday = (date = new Date()) => {
  const manilaDate = parseISODate(getManilaISODate(date));
  const nextMonday = addDays(manilaDate, 1);
  return getWeekNumberForDate(nextMonday);
};
