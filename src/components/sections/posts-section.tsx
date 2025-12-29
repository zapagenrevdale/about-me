import Link from "next/link";

import { PostItem } from "@/components/common/post-item";
import { Section } from "@/components/section";
import { posts } from "@/data/posts";

export function PostsSection() {
  return (
    <Section
      action={
        <Link className="granular-dash text-xs" href="/posts">
          VIEW ALL
        </Link>
      }
      className="mt-12"
      title="/POSTS"
    >
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </Section>
  );
}
