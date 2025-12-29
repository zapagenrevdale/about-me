import { PageShell } from "@/components/page-shell";
import { HeroSection } from "@/components/sections/hero-section";
import { HustleSection } from "@/components/sections/hustle-section";
import { NavigationLinksSection } from "@/components/sections/navigation-links-section";
import { PostsSection } from "@/components/sections/posts-section";
import { WorkSection } from "@/components/sections/work-section";

export default function Home() {
  return (
    <PageShell>
      <HeroSection />
      <NavigationLinksSection />
      <WorkSection />
      <HustleSection />
      <PostsSection />
    </PageShell>
  );
}
