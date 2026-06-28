"use client";

import { RotateCcw } from "lucide-react";
import posthog from "posthog-js";
import { useEffect } from "react";

import { BackLink } from "@/components/back-link";
import { PageShell } from "@/components/page-shell";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.captureException(error, {
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <PageShell>
      <BackLink href="/">Home</BackLink>

      <article className="mt-8">
        <header className="mb-8">
          <h1 className="mb-4 font-bold text-2xl">Something broke</h1>
          <p className="text-neutral-400">This page hit an unexpected error.</p>
        </header>

        <button
          className="granular-dash flex w-fit items-center gap-1 text-neutral-700 dark:text-neutral-300"
          onClick={reset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
      </article>
    </PageShell>
  );
}
