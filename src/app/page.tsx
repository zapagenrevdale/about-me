import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-6">
        <Avatar className="h-32 w-32">
          <AvatarImage
            alt="Genrev Dale Zapa"
            src="https://github.com/shadcn.png"
          />
          <AvatarFallback>GZ</AvatarFallback>
        </Avatar>

        <h1 className="font-medium text-4xl tracking-tight">
          Genrev Dale Zapa
        </h1>

        <p className="max-w-md text-center text-muted-foreground">
          Designer, developer, and maker of things on the internet.
        </p>
      </main>
    </div>
  );
}
