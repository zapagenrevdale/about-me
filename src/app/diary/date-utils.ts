import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { DiaryPeriod, DiaryPeriodType } from "./types";

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export const DIARY_LEVELS: DiaryPeriodType[] = ["year", "month", "week", "day"];

export const EMPTY_TIPTAP_DOCUMENT = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export function getVisiblePeriods(
  level: DiaryPeriodType,
  anchorDate: Date
): DiaryPeriod[] {
  if (level === "year") {
    return getYearPeriods(anchorDate);
  }

  if (level === "month") {
    return getMonthPeriods(anchorDate);
  }

  if (level === "week") {
    return getWeekPeriods(anchorDate);
  }

  return getDayPeriods(anchorDate);
}

export function moveAnchorDate(
  level: DiaryPeriodType,
  anchorDate: Date,
  direction: -1 | 1
) {
  if (level === "year") {
    return addYears(anchorDate, direction * 12);
  }

  if (level === "month") {
    return addYears(anchorDate, direction);
  }

  if (level === "week") {
    return addMonths(anchorDate, direction);
  }

  return addWeeks(anchorDate, direction);
}

export function getLevelTitle(level: DiaryPeriodType, anchorDate: Date) {
  if (level === "year") {
    const startYear = anchorDate.getFullYear() - 5;
    return `${startYear} - ${startYear + 11}`;
  }

  if (level === "month") {
    return format(anchorDate, "yyyy");
  }

  if (level === "week") {
    return format(anchorDate, "MMMM yyyy");
  }

  const weekStart = startOfWeek(anchorDate, WEEK_OPTIONS);
  const weekEnd = addDays(weekStart, 6);

  return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
}

export function getTodayPeriodKey(level: DiaryPeriodType, today: Date) {
  if (level === "year") {
    return periodKey("year", new Date(today.getFullYear(), 0, 1));
  }

  if (level === "month") {
    return periodKey(
      "month",
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }

  if (level === "week") {
    return periodKey("week", startOfWeek(today, WEEK_OPTIONS));
  }

  return periodKey("day", today);
}

export function isTodayPeriod(period: DiaryPeriod, today: Date) {
  return period.key === getTodayPeriodKey(period.type, today);
}

export function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getYearPeriods(anchorDate: Date) {
  const startYear = anchorDate.getFullYear() - 5;

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(startYear + index, 0, 1);
    const year = format(date, "yyyy");

    return createPeriod({
      date,
      detail: "Year note",
      label: year,
      rangeLabel: year,
      type: "year",
    });
  });
}

function getMonthPeriods(anchorDate: Date) {
  const year = anchorDate.getFullYear();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);

    return createPeriod({
      date,
      detail: format(date, "yyyy"),
      label: format(date, "MMM"),
      rangeLabel: format(date, "MMMM yyyy"),
      type: "month",
    });
  });
}

function getWeekPeriods(anchorDate: Date) {
  const firstWeek = startOfWeek(startOfMonth(anchorDate), WEEK_OPTIONS);
  const lastWeek = endOfWeek(endOfMonth(anchorDate), WEEK_OPTIONS);
  const periods: DiaryPeriod[] = [];

  for (let date = firstWeek; date <= lastWeek; date = addWeeks(date, 1)) {
    const weekEnd = addDays(date, 6);

    periods.push(
      createPeriod({
        date,
        detail: `${format(date, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        label: `W${getISOWeek(date)}`,
        rangeLabel: `${format(date, "MMM d")} - ${format(
          weekEnd,
          "MMM d, yyyy"
        )}`,
        type: "week",
      })
    );
  }

  return periods;
}

function getDayPeriods(anchorDate: Date) {
  const weekStart = startOfWeek(anchorDate, WEEK_OPTIONS);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);

    return createPeriod({
      date,
      detail: format(date, "MMM yyyy"),
      label: format(date, "EEE d"),
      rangeLabel: format(date, "EEEE, MMMM d, yyyy"),
      type: "day",
    });
  });
}

function createPeriod({
  date,
  detail,
  label,
  rangeLabel,
  type,
}: {
  date: Date;
  detail: string;
  label: string;
  rangeLabel: string;
  type: DiaryPeriodType;
}): DiaryPeriod {
  const start = dateKey(date);

  return {
    key: `${type}:${start}`,
    type,
    start,
    label,
    detail,
    rangeLabel,
  };
}

function periodKey(type: DiaryPeriodType, date: Date) {
  return `${type}:${dateKey(date)}`;
}
