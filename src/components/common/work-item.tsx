import Link from "next/link";

import { cn } from "@/lib/utils";
import type { WorkExperience } from "@/types";

type WorkItemProps = {
  work: WorkExperience;
};

export function WorkItem({ work }: WorkItemProps) {
  return (
    <div className="work-item-wrapper">
      <Link
        className={cn("granular-dash", work.className)}
        href={work.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {work.company}
      </Link>
      <div className="work-line" />
      <span className={work.isActive ? "" : "text-muted-foreground"}>
        {work.period}
      </span>
    </div>
  );
}
