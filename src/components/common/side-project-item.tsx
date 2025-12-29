import Link from "next/link";
import type { SideProject } from "@/types";

type SideProjectItemProps = {
  project: SideProject;
};

export function SideProjectItem({ project }: SideProjectItemProps) {
  return (
    <div className="work-item-wrapper">
      <Link
        className="granular-dash"
        href={project.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {project.name}
      </Link>
      <div className="work-line" />
      <p className="text-neutral-400">{project.description}</p>
    </div>
  );
}
