import Link from "next/link";
import type { NavigationLink } from "@/types";

interface NavLinkCardProps {
  link: NavigationLink;
}

export function NavLinkCard({ link }: NavLinkCardProps) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground">{link.label}</p>
      <Link href={link.href} className="granular-dash">
        {link.title}
      </Link>
    </div>
  );
}
