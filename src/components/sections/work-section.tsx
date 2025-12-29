import { WorkItem } from "@/components/common/work-item";
import { workExperience } from "@/data/work-experience";

export function WorkSection() {
  return (
    <section className="mt-16 space-y-3">
      <p className="text-muted-foreground text-xs">WORK</p>
      {workExperience.map((work) => (
        <WorkItem key={work.id} work={work} />
      ))}
    </section>
  );
}
