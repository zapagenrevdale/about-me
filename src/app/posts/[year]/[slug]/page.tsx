import { format, getYear } from "date-fns";
import { ArrowUpLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { posts } from "@/data/posts";
import { getReadTime } from "@/lib/utils";

type PostPageProps = {
  params: Promise<{ year: string; slug: string }>;
};

export function generateStaticParams() {
  return posts.map((post) => ({
    year: String(getYear(new Date(post.date))),
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

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
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen justify-center px-2 lg:px-0">
      <main className="w-full max-w-xl py-32 text-sm">
        <Link className="granular-dash flex w-fit items-center" href="/">
          <ArrowUpLeft className="h-4.5" /> Articles
        </Link>

        <article className="mt-8">
          <header className="mb-8">
            <h1 className="mb-4 font-bold text-4xl">{post.title}</h1>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <p className="text-neutral-400">{post.description}</p>
                <p className="text-teal-400 text-xs">
                  {getReadTime(post.content ?? "0")} min read
                </p>
              </div>
              <p>{format(new Date(post.date), "MMM d, yyyy")}</p>
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
      </main>
    </div>
  );
}
