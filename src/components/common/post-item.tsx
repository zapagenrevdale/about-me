import Link from "next/link";

import { getPostPath, getPostYear } from "@/lib/posts";
import { cn } from "@/lib/utils";
import type { Post } from "@/types";

type PostItemProps = {
  post: Post;
};

export function PostItem({ post }: PostItemProps) {
  const path = getPostPath(post);
  const year = getPostYear(post);
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;
  const yearClassName = isCurrentYear ? undefined : "text-muted-foreground";

  return (
    <>
      <div className="flex flex-col gap-1 md:hidden">
        <div className="flex items-center justify-between">
          <Link className="granular-dash" href={path}>
            {post.title}
          </Link>
          <p className={cn("text-sm", yearClassName)}>{year}</p>
        </div>
        <p className="text-neutral-400 text-sm">{post.description}</p>
      </div>

      <div className="work-item-wrapper hidden md:flex">
        <Link className="granular-dash" href={path}>
          {post.title}
        </Link>
        <p className="text-neutral-400">{post.description}</p>
        <div className="work-line" />
        <p className={yearClassName}>{year}</p>
      </div>
    </>
  );
}
