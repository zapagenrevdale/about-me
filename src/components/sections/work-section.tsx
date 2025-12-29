import { TimelineItem } from "@/components/common/timeline-item";
import { Section } from "@/components/section";
import { workExperience } from "@/data/work-experience";

export function WorkSection() {
  return (
    <Section className="mt-16" title="WORK">
      {workExperience.map((work) => (
        <TimelineItem item={work} key={work.id} />
      ))}
    </Section>
  );
}
