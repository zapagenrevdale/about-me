import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
};

export function Section({ children, title, action, className }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className={cn(action && "flex justify-between")}>
        <p className="text-muted-foreground text-xs">{title}</p>
        {action}
      </div>
      {children}
    </section>
  );
}
