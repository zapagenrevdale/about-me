import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Someday | Genrev Zapa",
  description: "Redirects to the diary lifespan map.",
};

export default function Someday() {
  redirect("/diary");
}
