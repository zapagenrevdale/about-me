import type { Instrumentation } from "next";

import PostHogClient from "@/lib/posthog-server";

function getHeaderValue(headers: NodeJS.Dict<string | string[]>, name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  const posthog = PostHogClient();

  if (!posthog) {
    return;
  }

  const distinctId = getHeaderValue(request.headers, "x-posthog-distinct-id");

  posthog.captureException(error, distinctId, {
    method: request.method,
    path: request.path,
    render_source: context.renderSource,
    revalidate_reason: context.revalidateReason,
    route_path: context.routePath,
    route_type: context.routeType,
    router_kind: context.routerKind,
  });

  await posthog.shutdown();
};
