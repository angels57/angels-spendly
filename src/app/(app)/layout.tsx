import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { InstallPrompt } from "@/components/pwa";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/login/actions";
import { getActiveList, getCurrentUser } from "@/lib/data";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-6">
      <div className="flex flex-col gap-4">
        {/* Leer la sesión en el layout bloquearía {children}: va en Suspense. */}
        <Suspense fallback={<HeaderSkeleton />}>
          <AppHeader />
        </Suspense>
        <AppNav />
        <InstallPrompt />
      </div>
      {children}
    </main>
  );
}

async function AppHeader() {
  const [user, list] = await Promise.all([getCurrentUser(), getActiveList()]);
  return (
    <header className="flex items-center gap-3">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-2xl">
        {list.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-extrabold tracking-tight">{list.name}</h1>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
      <ThemeToggle />
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Cerrar sesión"
        >
          <LogOut />
        </Button>
      </form>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 rounded-2xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}
