import type { Metadata } from "next";

import { hasDiaryAuth } from "@/lib/diary-auth";

import { DiaryClient } from "./diary-client";

export const metadata: Metadata = {
  title: "Diary | Genrev Zapa",
  description: "A public lifespan map with unveiled private diary entries.",
};

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  const isUnveiled = await hasDiaryAuth();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-col">
      <DiaryClient initialIsUnveiled={isUnveiled} />
    </main>
  );
}
