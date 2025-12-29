import { type ClassValue, clsx } from "clsx";
import type React from "react";
import { twMerge } from "tailwind-merge";

const WORD_PATTERN = /\s+/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Recursively extracts plain text from a React element tree.
 * Used for calculating reading time from JSX post content.
 */
function extractTextFromReactNode(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join(" ");
  }

  if (typeof node === "object" && "props" in node) {
    const element = node as React.ReactElement;
    const props = element.props as Record<string, unknown> | undefined;
    if (props?.children) {
      return extractTextFromReactNode(props.children as React.ReactNode);
    }
  }

  return "";
}

export function getReadTime(content: string | React.ReactNode): number {
  const wordsPerMinute = 200;

  const textContent =
    typeof content === "string" ? content : extractTextFromReactNode(content);

  const wordCount = textContent.trim().split(WORD_PATTERN).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
