import { format } from "date-fns";

import type { Post } from "@/types";

const DISPLAY_DATE_FORMAT = "MMM d, yyyy";

type PostDate = Pick<Post, "date">;
type PostPath = Pick<Post, "date" | "slug">;

export function getPostDate(post: PostDate) {
  return new Date(post.date);
}

export function getPostYear(post: PostDate) {
  return getPostDate(post).getFullYear();
}

export function getPostPath(post: PostPath) {
  return `/posts/${getPostYear(post)}/${post.slug}`;
}

export function formatPostDate(post: PostDate) {
  return format(getPostDate(post), DISPLAY_DATE_FORMAT);
}

export function getFeedContent(post: Post) {
  return typeof post.content === "string" ? post.content : post.description;
}
