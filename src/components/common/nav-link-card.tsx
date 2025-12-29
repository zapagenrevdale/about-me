import Link from "next/link";
import type { NavigationLink } from "@/types";

type NavLinkCardProps = {
  link: NavigationLink;
};

export function NavLinkCard({ link }: NavLinkCardProps) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground">{link.label}</p>
      <Link className="granular-dash" href={link.href}>
        {link.title}
      </Link>
    </div>
  );
}
