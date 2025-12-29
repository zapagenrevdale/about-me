import { Badge } from "@/components/ui/badge";

const technologies = {
  Frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
  Backend: ["Node.js", "Python", "PostgreSQL", "MongoDB", "Redis"],
  "Tools & Platforms": ["Git", "Docker", "AWS", "Vercel", "Figma"],
};

export function TechStackSection() {
  return (
    <section className="space-y-6">
      <h2 className="font-semibold text-2xl tracking-tight">Tech Stack</h2>
      <div className="space-y-6">
        {Object.entries(technologies).map(([category, techs]) => (
          <div className="space-y-3" key={category}>
            <h3 className="font-medium text-muted-foreground text-sm">
              {category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {techs.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
