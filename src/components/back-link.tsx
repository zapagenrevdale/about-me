import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BackLinkProps = {
  children: ReactNode;
  href: string;
  className?: string;
};

export function BackLink({ children, href, className }: BackLinkProps) {
  return (
    <Link
      className={cn("granular-dash flex w-fit items-center", className)}
      href={href}
    >
      <ArrowUpLeft className="h-4.5" />
      {children}
    </Link>
  );
}
