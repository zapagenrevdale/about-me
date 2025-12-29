import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";

type PageMessageProps = {
  title: string;
  subtitle: string;
  description: React.ReactNode;
};

export function PageMessage({
  title,
  subtitle,
  description,
}: PageMessageProps) {
  return (
    <div className="flex min-h-screen justify-center px-2 lg:px-0">
      <main className="w-full max-w-xl py-32 text-sm">
        <Link className="granular-dash flex w-fit items-center" href="/">
          <ArrowUpLeft className="h-4.5" /> Home
        </Link>

        <article className="mt-8">
          <header className="mb-8">
            <h1 className="mb-4 font-bold text-2xl">{title}</h1>
            <p className="text-neutral-400">{subtitle}</p>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-300">
              {description}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
