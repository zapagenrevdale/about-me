import { Feed } from "feed";

import { posts } from "@/data/posts";
import { getFeedContent, getPostDate, getPostPath } from "@/lib/posts";

const AUTHOR = {
  name: "Genrev Zapa",
};

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://genrevzapa.com";

  const feed = new Feed({
    title: "Genrev Zapa",
    description: "Learn who the heck Genrev Zapa is and what's he up to.",
    id: baseUrl,
    link: baseUrl,
    language: "en",
    favicon: `${baseUrl}/profile.ico`,
    copyright: `© ${new Date().getFullYear()} Genrev Zapa`,
    author: AUTHOR,
  });

  for (const post of posts) {
    const postUrl = new URL(getPostPath(post), baseUrl).toString();

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: post.description,
      content: getFeedContent(post),
      date: getPostDate(post),
      author: [AUTHOR],
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
