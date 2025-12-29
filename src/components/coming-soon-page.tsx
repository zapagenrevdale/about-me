import type { ReactNode } from "react";

import { PageMessage } from "@/components/page-message";

type ComingSoonPageProps = {
  title?: string;
  subtitle?: string;
  description?: ReactNode;
};

export function ComingSoonPage({
  title = "Coming Soon",
  subtitle = "Under construction",
  description = (
    <>
      Something <span className="text-teal-400">interesting</span> is being
      built here. Check back soon to see what happens.
    </>
  ),
}: ComingSoonPageProps) {
  return (
    <PageMessage description={description} subtitle={subtitle} title={title} />
  );
}
