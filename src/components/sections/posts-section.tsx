import Link from "next/link";
import { PostItem } from "@/components/common/post-item";
import { posts } from "@/data/posts";

export function PostsSection() {
  return (
    <section className="mt-12 space-y-3">
      <div className="flex justify-between">
        <p className="text-muted-foreground text-xs">/POSTS</p>
        <Link className="granular-dash text-xs" href="/posts">
          VIEW ALL
        </Link>
      </div>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </section>
  );
}
