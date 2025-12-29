"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "about", href: "#about", external: false },
  { label: "hobbies", href: "#hobbies", external: false },
  { label: "code", href: "#code", external: true },
  { label: "linkedin", href: "#linkedin", external: true },
];

export function Sidebar() {
  return (
    <aside className="sticky top-1/2 left-0 grid h-full -translate-y-1/2 gap-4">
      <Link className="flex justify-end" href="/">
        <Avatar className="h-12 w-12">
          <AvatarImage alt="Gen Revzapa" src="/profile.jpg" />
          <AvatarFallback>GR</AvatarFallback>
        </Avatar>
      </Link>

      <nav className="grid gap-4 text-right">
        {navItems.map((item) => (
          <Link
            className="group flex items-center justify-end gap-2 text-foreground text-sm transition-colors hover:text-foreground/70"
            href={item.href}
            key={item.label}
          >
            <span>{item.label}</span>
            {item.external ? (
              <ExternalLink className="h-3 w-3 opacity-50" />
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
