import { Link } from "@tanstack/react-router";
import { Compass, PlusCircle, Swords, User2, Wallet } from "lucide-react";
import { money } from "@/lib/pact-types";
import { useStore } from "@/lib/pact-store";

const links = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/create", label: "Create", icon: PlusCircle },
  { to: "/my-challenges", label: "My bets", icon: Swords },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User2 },
] as const;

export function Nav() {
  const { me } = useStore();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold tracking-tight neon-text">
          POTLUCK
        </Link>
        <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-primary/15 text-primary" }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <Link
          to="/wallet"
          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-sm font-semibold text-primary tabular-nums"
        >
          {money(me.balance)}
        </Link>
      </div>
    </header>
  );
}
