import { SideProjectItem } from "@/components/common/side-project-item";
import { sideProjects } from "@/data/side-projects";

export function SideProjectsSection() {
  return (
    <section className="mt-12 space-y-3">
      <p className="text-muted-foreground text-xs">SIDE PROJECTS</p>
      {sideProjects.map((project) => (
        <SideProjectItem key={project.id} project={project} />
      ))}
    </section>
  );
}
