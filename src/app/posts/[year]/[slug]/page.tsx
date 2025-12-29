import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/back-link";
import { PageShell } from "@/components/page-shell";
import { posts } from "@/data/posts";
import { formatPostDate, getPostYear } from "@/lib/posts";
import { getReadTime } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ year: string; slug: string }>;
};

export function generateStaticParams() {
  return posts.map((post) => ({
    year: String(getPostYear(post)),
    slug: post.slug,
  }));
}

function findPost(year: string, slug: string) {
  return posts.find(
    (post) => String(getPostYear(post)) === year && post.slug === slug
  );
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug, year } = await params;
  const post = findPost(year, slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, year } = await params;
  const post = findPost(year, slug);

  if (!post) {
    notFound();
  }

  return (
    <PageShell>
      <BackLink href="/posts">Articles</BackLink>

      <article className="mt-8">
        <header className="mb-8">
          <h1 className="mb-4 font-bold text-4xl">{post.title}</h1>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <p className="text-neutral-400">{post.description}</p>
              <p className="text-teal-400 text-xs">
                {getReadTime(post.content ?? post.description)} min read
              </p>
            </div>
            <p>{formatPostDate(post)}</p>
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          {typeof post.content === "string" ? (
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-300">
              {post.content}
            </p>
          ) : (
            <div className="text-neutral-700 leading-relaxed dark:text-neutral-300">
              {post.content}
            </div>
          )}
        </div>
      </article>
    </PageShell>
  );
}
