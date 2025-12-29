import Link from "next/link";

export function HeroSection() {
  return (
    <section className="w-full space-y-1">
      <h1>Genrev Zapa</h1>
      <p className="text-muted-foreground">
        Software/AI Engineer | Cloud Infrastructure
      </p>
      <div className="mt-10">
        <span className="text-teal-400">Building software that matters.</span>{" "}
        <span>
          A startup enthusiast with a love for early-stage chaos — co-founded{" "}
          <Link
            className="granular-dash text-muted-foreground"
            href="https://www.aetherlenz.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            AetherLenz
          </Link>
          .
        </span>
      </div>
    </section>
  );
}
