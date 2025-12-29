import Link from "next/link";
import type { Post } from "@/types";

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  const Component = post.url ? Link : "div";

  return (
    <div className="work-item-wrapper">
      {post.url ? (
        <Link
          href={post.url}
          className="granular-dash"
          target="_blank"
          rel="noopener noreferrer"
        >
          {post.title}
        </Link>
      ) : (
        <div className="granular-dash">{post.title}</div>
      )}
      <p className="text-neutral-400">{post.description}</p>
      <div className="work-line" />
      <p>{post.year}</p>
    </div>
  );
}
