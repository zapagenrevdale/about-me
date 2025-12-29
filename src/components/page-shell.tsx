import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="flex min-h-screen justify-center">
      <main className={cn("w-full max-w-xl text-sm", className)}>
        {children}
      </main>
    </div>
  );
}
