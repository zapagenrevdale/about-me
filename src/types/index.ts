export interface WorkExperience {
  id: string;
  company: string;
  url: string;
  period: string;
  isActive?: boolean;
  className?: string;
}

export interface Hustle {
  id: string;
  company: string;
  url: string;
  period: string;
  isActive?: boolean;
  className?: string;
}

export interface SideProject {
  id: string;
  name: string;
  url: string;
  description: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  year: string;
  url?: string;
}

export interface NavigationLink {
  id: string;
  label: string;
  title: string;
  href: string;
}
