import type { JSONContent } from "@tiptap/core";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const diaryEntries = sqliteTable("diary_entries", {
  periodKey: text("period_key").primaryKey(),
  periodType: text("period_type", {
    enum: ["year", "month", "week", "day"],
  }).notNull(),
  periodStart: text("period_start").notNull(),
  contentJson: text("content_json", { mode: "json" })
    .$type<JSONContent>()
    .notNull(),
  plainText: text("plain_text").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;
