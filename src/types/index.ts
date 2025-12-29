import type React from "react";

export type WorkExperience = {
  id: string;
  company: string;
  url: string;
  period: string;
  isActive?: boolean;
  className?: string;
};

export type Hustle = {
  id: string;
  company: string;
  url: string;
  period: string;
  isActive?: boolean;
  className?: string;
};

export type SideProject = {
  id: string;
  name: string;
  url: string;
  description: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  content?: string | React.ReactNode;
  url?: string;
};

export type NavigationLink = {
  id: string;
  label: string;
  title: string;
  href: string;
};
