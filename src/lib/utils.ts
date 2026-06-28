import { type ClassValue, clsx } from "clsx";
import { isValidElement, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const WORDS_PER_MINUTE = 200;
const WORD_PATTERN = /\s+/g;
const NON_SLUG_CHARACTERS = /[^\p{Letter}\p{Mark}\p{Number}\s-]/gu;
const REPEATED_DASHES = /-+/g;
const BOUNDARY_DASHES = /^-+|-+$/g;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, "")
    .replace(WORD_PATTERN, "-")
    .replace(REPEATED_DASHES, "-")
    .replace(BOUNDARY_DASHES, "")
    .trim();
}

/**
 * Recursively extracts plain text from a React element tree.
 * Used for calculating reading time from JSX post content.
 */
function extractTextFromReactNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join(" ");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextFromReactNode(node.props.children);
  }

  return "";
}

export function getReadTime(content: ReactNode): number {
  const textContent =
    typeof content === "string" ? content : extractTextFromReactNode(content);

  const trimmedContent = textContent.trim();
  const wordCount = trimmedContent
    ? trimmedContent.split(WORD_PATTERN).length
    : 0;

  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
