import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";

import { PostItem } from "@/components/common/post-item";
import { posts } from "@/data/posts";

export default function PostsArchive() {
  return (
    <div className="flex min-h-screen justify-center px-2 lg:px-0">
      <main className="w-full max-w-xl text-sm">
        <div className="flex items-center justify-between">
          <Link className="granular-dash flex w-fit items-center" href="/">
            <ArrowUpLeft className="h-4.5" /> Home
          </Link>
          <a
            className="granular-dash text-teal-400 hover:opacity-80"
            href="/feed.xml"
            title="RSS Feed"
          >
            RSS
          </a>
        </div>

        <section className="mt-12 space-y-3">
          <p className="text-muted-foreground text-xs">/POSTS</p>
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </section>
      </main>
    </div>
  );
}
