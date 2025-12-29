import { WorkItem } from "@/components/common/work-item";
import { hustleProjects } from "@/data/hustle";

export function HustleSection() {
  return (
    <section className="mt-12 space-y-3">
      <p className="text-muted-foreground text-xs">HUSTLE</p>
      {hustleProjects.map((hustle) => (
        <WorkItem key={hustle.id} work={hustle} />
      ))}
    </section>
  );
}
