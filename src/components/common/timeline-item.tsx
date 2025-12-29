import Link from "next/link";

import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/types";

type TimelineItemProps = {
  item: TimelineEntry;
};

export function TimelineItem({ item }: TimelineItemProps) {
  return (
    <div className="work-item-wrapper">
      <Link
        className={cn("granular-dash", item.className)}
        href={item.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {item.title}
      </Link>
      <div className="work-line" />
      <span className={item.isCurrent ? undefined : "text-muted-foreground"}>
        {item.period}
      </span>
    </div>
  );
}
