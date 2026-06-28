import { NavLinkCard } from "@/components/common/nav-link-card";
import { navigationLinks } from "@/data/navigation-links";

export function NavigationLinksSection() {
  return (
    <section className="mt-14 grid grid-cols-2 gap-y-6 md:grid-cols-3">
      {navigationLinks.map((link) => (
        <NavLinkCard key={link.id} link={link} />
      ))}
    </section>
  );
}
