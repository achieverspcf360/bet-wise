import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Search } from "lucide-react";
import { useStore } from "@/lib/pact-store";
import { CATEGORIES, money, potOf } from "@/lib/pact-types";
import { ChallengeCard } from "@/components/pact/ChallengeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Potluck — Peer-to-Peer Challenges & Friendly Bets" },
      {
        name: "description",
        content:
          "Create or join peer-to-peer challenges on sports, finance, weather and more. Live pots, transparent payouts, play-money wallet.",
      },
      { property: "og:title", content: "Potluck — Peer-to-Peer Challenges & Friendly Bets" },
      {
        property: "og:description",
        content: "Back your call, watch the pot grow live, and get paid out automatically.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

type Sort = "trending" | "closing" | "biggest";

function Discover() {
  const { state, userById } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("trending");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = state.challenges.filter((c) => {
      const host = userById(c.initiatorId);
      const matches =
        !term ||
        c.title.toLowerCase().includes(term) ||
        host?.username.toLowerCase().includes(term);
      return matches && (cat === "All" || c.category === cat) && c.status === "open";
    });
    return filtered.sort((a, b) => {
      if (sort === "closing") return a.deadline - b.deadline;
      if (sort === "biggest") return potOf(b) - potOf(a);
      return b.entries.length - a.entries.length;
    });
  }, [state.challenges, q, cat, sort, userById]);

  const totalPot = state.challenges.reduce((s, c) => s + potOf(c), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="surface-card relative overflow-hidden p-8 sm:p-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Flame className="size-3.5" /> {money(totalPot)} live across all pots
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Back your call. <span className="neon-text">Watch the pot grow.</span>
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Peer-to-peer challenges on anything with a clear outcome. Pick a side, stake play money,
          and let the payout engine split the winnings automatically.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/create">Start a challenge</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/wallet">Top up wallet</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search challenges or @username"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["trending", "closing", "biggest"] as Sort[]).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={sort === s ? "default" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "closing" ? "Closing soon" : s === "biggest" ? "Biggest pot" : "Trending"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              cat === c
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <ChallengeCard key={c.id} challenge={c} initiator={userById(c.initiatorId)!} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          Nothing matches that yet — try another filter or start your own.
        </p>
      )}
    </div>
  );
}
