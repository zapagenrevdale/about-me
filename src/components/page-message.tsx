import type { ReactNode } from "react";

import { BackLink } from "@/components/back-link";
import { PageShell } from "@/components/page-shell";

type PageMessageProps = {
  title: string;
  subtitle: string;
  description: ReactNode;
};

export function PageMessage({
  title,
  subtitle,
  description,
}: PageMessageProps) {
  return (
    <PageShell>
      <BackLink href="/">Home</BackLink>

      <article className="mt-8">
        <header className="mb-8">
          <h1 className="mb-4 font-bold text-2xl">{title}</h1>
          <p className="text-neutral-400">{subtitle}</p>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-neutral-700 leading-relaxed dark:text-neutral-300">
            {description}
          </p>
        </div>
      </article>
    </PageShell>
  );
}
