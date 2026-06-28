const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export const START_YEAR = 2026;
export const END_YEAR = 2056;
export const START_DATE_KEY = "2026-06-28";
export const END_DATE_KEY = "2056-11-30";
export const START_MONTH_KEY = "2026-06";
export const START_WEEK_KEY = START_DATE_KEY;
export const START_DATE_LABEL = "June 28, 2026";
export const END_DATE_LABEL = "November 30, 2056";

const START_DATE_UTC = Date.UTC(2026, 5, 28);
const END_DATE_UTC = Date.UTC(2056, 10, 30);
const START_MONTH_INDEX = new Date(START_DATE_UTC).getUTCMonth();
const END_MONTH_INDEX = new Date(END_DATE_UTC).getUTCMonth();
const WEEK_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  timeZone: "UTC",
});

export type LifespanYear = {
  dateKeys: string[];
  year: number;
};

export type LifespanMonth = {
  key: string;
  label: string;
};

export type LifespanWeek = {
  endKey: string;
  key: string;
  label: string;
};

export type LifespanMonthBox = LifespanMonth & {
  year: number;
};

export type LifespanWeekBox = LifespanWeek & {
  year: number;
};

export type LifespanMonthYear = {
  months: LifespanMonth[];
  year: number;
};

export type LifespanWeekYear = {
  weeks: LifespanWeek[];
  year: number;
};

export const LIFESPAN_YEARS = createLifespanYears();
export const LIFESPAN_WEEK_YEARS = createLifespanWeekYears();
export const LIFESPAN_MONTH_YEARS = createLifespanMonthYears();
export const LIFESPAN_DAY_KEYS = LIFESPAN_YEARS.flatMap(
  (year) => year.dateKeys
);
export const LIFESPAN_WEEKS = LIFESPAN_WEEK_YEARS.flatMap((year) =>
  year.weeks.map((week) => ({
    ...week,
    year: year.year,
  }))
);
export const LIFESPAN_MONTHS = LIFESPAN_MONTH_YEARS.flatMap((year) =>
  year.months.map((month) => ({
    ...month,
    year: year.year,
  }))
);
export const LIFESPAN_YEAR_COUNT = LIFESPAN_YEARS.length;
export const LIFESPAN_DAY_COUNT = LIFESPAN_YEARS.reduce(
  (total, year) => total + year.dateKeys.length,
  0
);
export const LIFESPAN_WEEK_COUNT = LIFESPAN_WEEK_YEARS.reduce(
  (total, year) => total + year.weeks.length,
  0
);
export const LIFESPAN_MONTH_COUNT = LIFESPAN_MONTH_YEARS.reduce(
  (total, year) => total + year.months.length,
  0
);

export function getLifespanWeekKey(date: Date) {
  const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const weekIndex = Math.floor((dateUtc - START_DATE_UTC) / MS_PER_WEEK);

  return toDateKey(START_DATE_UTC + weekIndex * MS_PER_WEEK);
}

function createLifespanYears(): LifespanYear[] {
  return Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => {
    const year = START_YEAR + index;
    const yearStart = Math.max(Date.UTC(year, 0, 1), START_DATE_UTC);
    const yearEnd = Math.min(Date.UTC(year, 11, 31), END_DATE_UTC);
    const dayCount = Math.floor((yearEnd - yearStart) / MS_PER_DAY) + 1;

    return {
      dateKeys: Array.from({ length: dayCount }, (_day, dayIndex) =>
        toDateKey(yearStart + dayIndex * MS_PER_DAY)
      ),
      year,
    };
  });
}

function toDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function createLifespanWeekYears(): LifespanWeekYear[] {
  const weeksByYear = new Map<number, LifespanWeek[]>();

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    weeksByYear.set(year, []);
  }

  const dayCount = Math.floor((END_DATE_UTC - START_DATE_UTC) / MS_PER_DAY) + 1;
  const weekCount = Math.ceil(dayCount / 7);

  for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
    const weekStart = START_DATE_UTC + weekIndex * MS_PER_WEEK;
    const weekEnd = Math.min(weekStart + 6 * MS_PER_DAY, END_DATE_UTC);
    const year = new Date(weekStart).getUTCFullYear();

    weeksByYear.get(year)?.push({
      endKey: toDateKey(weekEnd),
      key: toDateKey(weekStart),
      label: formatWeekLabel(weekStart, weekEnd),
    });
  }

  return Array.from({ length: END_YEAR - START_YEAR + 1 }, (_item, index) => {
    const year = START_YEAR + index;

    return {
      weeks: weeksByYear.get(year) ?? [],
      year,
    };
  });
}

function formatWeekLabel(startTimestamp: number, endTimestamp: number) {
  return `${WEEK_LABEL_FORMATTER.format(
    new Date(startTimestamp)
  )} - ${WEEK_LABEL_FORMATTER.format(new Date(endTimestamp))}`;
}

function createLifespanMonthYears(): LifespanMonthYear[] {
  return Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, index) => {
    const year = START_YEAR + index;
    const firstMonth = year === START_YEAR ? START_MONTH_INDEX : 0;
    const lastMonth = year === END_YEAR ? END_MONTH_INDEX : 11;

    return {
      months: Array.from(
        { length: lastMonth - firstMonth + 1 },
        (_month, monthIndex) => {
          const month = firstMonth + monthIndex;

          return {
            key: `${year}-${String(month + 1).padStart(2, "0")}`,
            label: MONTH_LABEL_FORMATTER.format(
              new Date(Date.UTC(year, month, 1))
            ),
          };
        }
      ),
      year,
    };
  });
}
