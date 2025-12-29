import type { ReactNode } from "react";

export type TimelineEntry = {
  id: string;
  title: string;
  href: string;
  period: string;
  isCurrent?: boolean;
  className?: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  content?: ReactNode;
};

export type NavigationLink = {
  id: string;
  label: string;
  title: string;
  href: string;
};
