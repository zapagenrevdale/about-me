import { HeroSection } from "@/components/sections/hero-section";
import { HustleSection } from "@/components/sections/hustle-section";
import { NavigationLinksSection } from "@/components/sections/navigation-links-section";
import { PostsSection } from "@/components/sections/posts-section";
import { WorkSection } from "@/components/sections/work-section";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center">
      <main className="w-full max-w-xl py-32 text-sm">
        <HeroSection />
        <NavigationLinksSection />
        <WorkSection />
        <HustleSection />
        <PostsSection />
      </main>
    </div>
  );
}
