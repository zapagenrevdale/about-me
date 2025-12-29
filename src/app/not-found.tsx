import { PageMessage } from "@/components/page-message";

export default function NotFound() {
  return (
    <PageMessage
      description={
        <>
          You just hit a page that{" "}
          <span className="text-teal-400">doesn't exist</span>. This page is
          just as lost as you are.
        </>
      }
      subtitle="Page not found"
      title="404"
    />
  );
}
