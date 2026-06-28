import type { Post } from "@/types";

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

type PostDate = Pick<Post, "date">;
type PostPath = Pick<Post, "date" | "slug">;

export function getPostDate(post: PostDate) {
  return new Date(`${post.date}T00:00:00.000Z`);
}

export function getPostYear(post: PostDate) {
  return getPostDate(post).getUTCFullYear();
}

export function getPostPath(post: PostPath) {
  return `/posts/${getPostYear(post)}/${post.slug}`;
}

export function formatPostDate(post: PostDate) {
  return DISPLAY_DATE_FORMATTER.format(getPostDate(post));
}

export function getFeedContent(post: Post) {
  return typeof post.content === "string" ? post.content : post.description;
}
