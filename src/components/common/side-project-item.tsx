import Link from "next/link";
import type { SideProject } from "@/types";

interface SideProjectItemProps {
  project: SideProject;
}

export function SideProjectItem({ project }: SideProjectItemProps) {
  return (
    <div className="work-item-wrapper">
      <Link
        href={project.url}
        className="granular-dash"
        target="_blank"
        rel="noopener noreferrer"
      >
        {project.name}
      </Link>
      <div className="work-line" />
      <p className="text-neutral-400">{project.description}</p>
    </div>
  );
}
