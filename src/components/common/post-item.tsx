import { getYear } from "date-fns";
import Link from "next/link";
import type { Post } from "@/types";

type PostItemProps = {
  post: Post;
};

export function PostItem({ post }: PostItemProps) {
  const year = getYear(new Date(post.date));
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  return (
    <div className="work-item-wrapper">
      <Link className="granular-dash" href={`/posts/${year}/${post.slug}`}>
        {post.title}
      </Link>
      <p className="text-neutral-400">{post.description}</p>
      <div className="work-line" />
      <p className={isCurrentYear ? "" : "text-muted-foreground"}>{year}</p>
    </div>
  );
}
