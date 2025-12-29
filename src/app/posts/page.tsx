import Link from "next/link";

import { BackLink } from "@/components/back-link";
import { PostItem } from "@/components/common/post-item";
import { PageShell } from "@/components/page-shell";
import { Section } from "@/components/section";
import { posts } from "@/data/posts";

export default function PostsArchive() {
  return (
    <PageShell>
      <div className="flex items-center justify-between">
        <BackLink href="/">Home</BackLink>
        <Link
          className="granular-dash text-teal-400 hover:opacity-80"
          href="/feed.xml"
          title="RSS Feed"
        >
          RSS
        </Link>
      </div>

      <Section className="mt-12" title="/POSTS">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </Section>
    </PageShell>
  );
}
