"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { diaryEntries } from "@/db/schema";
import {
  clearDiarySessionCookie,
  hasDiaryAuth,
  requireDiaryAuth,
  setDiarySessionCookie,
  verifyDiaryPassword,
} from "@/lib/diary-auth";

import {
  DIARY_PERIOD_TYPES,
  type DiaryEntryInput,
  type DiaryEntryRecord,
  type DiaryEntrySummary,
  type DiaryPeriodType,
} from "./types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PLAIN_TEXT_LENGTH = 8000;

export type DiaryAuthState = {
  error: string | null;
  isAuthenticated: boolean;
};

export async function unveilDiary(
  _state: DiaryAuthState,
  formData: FormData
): Promise<DiaryAuthState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return {
      error: null,
      isAuthenticated: false,
    };
  }

  if (!(await verifyDiaryPassword(password))) {
    return {
      error: "Could not unveil.",
      isAuthenticated: false,
    };
  }

  try {
    await setDiarySessionCookie();
  } catch {
    return {
      error: "Diary auth is not configured.",
      isAuthenticated: false,
    };
  }

  revalidatePath("/diary");

  return {
    error: null,
    isAuthenticated: true,
  };
}

export async function veilDiary() {
  await clearDiarySessionCookie();
  revalidatePath("/diary");
}

export async function getDiaryEntrySummaries(
  periodTypes: readonly DiaryPeriodType[]
): Promise<DiaryEntrySummary[]> {
  if (!Array.isArray(periodTypes)) {
    throw new Error("Diary period types must be an array.");
  }

  const uniquePeriodTypes = Array.from(new Set(periodTypes));

  for (const periodType of uniquePeriodTypes) {
    if (!isDiaryPeriodType(periodType)) {
      throw new Error("Invalid diary period type.");
    }
  }

  const [firstPeriodType] = uniquePeriodTypes;

  if (!firstPeriodType) {
    return [];
  }

  const isOwner = await hasDiaryAuth();
  const periodWhere =
    uniquePeriodTypes.length === 1
      ? eq(diaryEntries.periodType, firstPeriodType)
      : inArray(diaryEntries.periodType, uniquePeriodTypes);
  const visibilityWhere = isOwner
    ? periodWhere
    : and(periodWhere, eq(diaryEntries.isPublic, true));

  return await db
    .select({
      periodKey: diaryEntries.periodKey,
      periodType: diaryEntries.periodType,
      periodStart: diaryEntries.periodStart,
      plainText: diaryEntries.plainText,
      isPublic: diaryEntries.isPublic,
      createdAt: diaryEntries.createdAt,
      updatedAt: diaryEntries.updatedAt,
    })
    .from(diaryEntries)
    .where(visibilityWhere);
}

export async function getDiaryEntry(
  periodKey: string
): Promise<DiaryEntryRecord | null> {
  validatePeriodKey(periodKey);

  const isOwner = await hasDiaryAuth();
  const visibilityWhere = isOwner
    ? eq(diaryEntries.periodKey, periodKey)
    : and(
        eq(diaryEntries.periodKey, periodKey),
        eq(diaryEntries.isPublic, true)
      );

  const [entry] = await db
    .select()
    .from(diaryEntries)
    .where(visibilityWhere)
    .limit(1);

  return entry ?? null;
}

export async function upsertDiaryEntry(
  input: DiaryEntryInput
): Promise<DiaryEntryRecord> {
  await requireDiaryAuth();

  validateDiaryEntryInput(input);

  const now = new Date().toISOString();
  const plainText = input.plainText.trim().slice(0, MAX_PLAIN_TEXT_LENGTH);

  const rows = await db
    .insert(diaryEntries)
    .values({
      periodKey: input.periodKey,
      periodType: input.periodType,
      periodStart: input.periodStart,
      contentJson: input.contentJson,
      plainText,
      isPublic: input.isPublic,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: diaryEntries.periodKey,
      set: {
        contentJson: input.contentJson,
        plainText,
        isPublic: input.isPublic,
        updatedAt: now,
      },
    })
    .returning();

  revalidatePath("/diary");

  const [entry] = rows;

  if (!entry) {
    throw new Error("Failed to save diary entry.");
  }

  return entry;
}

export async function deleteDiaryEntry(periodKey: string): Promise<string> {
  await requireDiaryAuth();

  validatePeriodKey(periodKey);

  await db.delete(diaryEntries).where(eq(diaryEntries.periodKey, periodKey));

  revalidatePath("/diary");

  return periodKey;
}

function validateDiaryEntryInput(input: DiaryEntryInput) {
  if (!isDiaryPeriodType(input.periodType)) {
    throw new Error("Invalid diary period type.");
  }

  validateDateKey(input.periodStart);

  if (input.periodKey !== `${input.periodType}:${input.periodStart}`) {
    throw new Error("Diary period key does not match its type and start date.");
  }

  validateContentJson(input.contentJson);

  if (typeof input.plainText !== "string") {
    throw new Error("Diary plain text must be a string.");
  }

  if (typeof input.isPublic !== "boolean") {
    throw new Error("Diary visibility must be a boolean.");
  }
}

function validatePeriodKey(periodKey: string) {
  const [type, start, extra] = periodKey.split(":");

  if (extra !== undefined || !isDiaryPeriodType(type)) {
    throw new Error("Invalid diary period key.");
  }

  validateDateKey(start);
}

function validateDateKey(value: string) {
  if (!DATE_PATTERN.test(value)) {
    throw new Error("Diary period start must use YYYY-MM-DD format.");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Diary period start is not a valid calendar date.");
  }
}

function validateContentJson(contentJson: unknown) {
  if (
    typeof contentJson !== "object" ||
    contentJson === null ||
    Array.isArray(contentJson)
  ) {
    throw new Error("Diary content must be a Tiptap JSON object.");
  }

  JSON.stringify(contentJson);
}

function isDiaryPeriodType(value: unknown): value is DiaryPeriodType {
  return (
    typeof value === "string" &&
    DIARY_PERIOD_TYPES.includes(value as DiaryPeriodType)
  );
}
