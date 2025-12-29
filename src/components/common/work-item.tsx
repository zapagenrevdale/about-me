import Link from "next/link";
import type { WorkExperience } from "@/types";
import { cn } from "@/lib/utils";

interface WorkItemProps {
  work: WorkExperience;
}

export function WorkItem({ work }: WorkItemProps) {
  return (
    <div className="work-item-wrapper">
      <Link
        href={work.url}
        className={cn("granular-dash", work.className)}
        target="_blank"
        rel="noopener noreferrer"
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
