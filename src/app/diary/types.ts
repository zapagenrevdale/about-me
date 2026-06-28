import type { JSONContent } from "@tiptap/core";

export const DIARY_PERIOD_TYPES = ["year", "month", "week", "day"] as const;

export type DiaryPeriodType = (typeof DIARY_PERIOD_TYPES)[number];

export type DiaryEntryRecord = {
  periodKey: string;
  periodType: DiaryPeriodType;
  periodStart: string;
  contentJson: JSONContent;
  plainText: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DiaryEntrySummary = Omit<DiaryEntryRecord, "contentJson">;

export type DiaryPeriod = {
  key: string;
  type: DiaryPeriodType;
  start: string;
  label: string;
  detail: string;
  rangeLabel: string;
};

export type DiaryEntryInput = {
  periodKey: string;
  periodType: DiaryPeriodType;
  periodStart: string;
  contentJson: JSONContent;
  plainText: string;
  isPublic: boolean;
};
