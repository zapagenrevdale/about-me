import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Diary Login | Genrev Zapa",
  description: "Redirects to diary unveil.",
};

export const dynamic = "force-dynamic";

export default function DiaryLoginPage() {
  redirect("/diary");
}
