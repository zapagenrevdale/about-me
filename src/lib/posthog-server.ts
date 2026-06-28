import { PostHog } from "posthog-node";

export default function PostHogClient() {
  const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

  if (!posthogToken) {
    return null;
  }

  return new PostHog(posthogToken, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}
