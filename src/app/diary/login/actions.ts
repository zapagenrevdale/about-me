"use server";

import { redirect } from "next/navigation";

import { setDiarySessionCookie, verifyDiaryPassword } from "@/lib/diary-auth";

export type DiaryLoginState = {
  error: string | null;
};

export async function loginToDiary(
  _state: DiaryLoginState,
  formData: FormData
): Promise<DiaryLoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return {
      error: "Enter the diary password.",
    };
  }

  if (!(await verifyDiaryPassword(password))) {
    return {
      error: "Invalid diary password.",
    };
  }

  try {
    await setDiarySessionCookie();
  } catch {
    return {
      error: "Diary auth is not configured.",
    };
  }

  redirect("/diary");
}
