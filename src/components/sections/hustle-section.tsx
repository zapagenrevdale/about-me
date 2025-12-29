import { TimelineItem } from "@/components/common/timeline-item";
import { Section } from "@/components/section";
import { hustleProjects } from "@/data/hustle";

export function HustleSection() {
  return (
    <Section className="mt-12" title="HUSTLE">
      {hustleProjects.map((hustle) => (
        <TimelineItem item={hustle} key={hustle.id} />
      ))}
    </Section>
  );
}
