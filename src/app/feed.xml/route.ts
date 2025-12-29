import { Feed } from "feed";
import { posts } from "@/data/posts";

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
    author: {
      name: "Genrev Zapa",
    },
  });

  for (const post of posts) {
    const postUrl = `${baseUrl}/posts/${new Date(post.date).getFullYear()}/${post.slug}`;

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: post.description,
      content:
        typeof post.content === "string" ? post.content : post.description,
      date: new Date(post.date),
      author: [
        {
          name: "Genrev Zapa",
        },
      ],
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
