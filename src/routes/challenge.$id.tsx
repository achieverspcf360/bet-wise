import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { warn } from "@/lib/warn";
import { Clock, MessageCircle, Share2, ShieldAlert, Users } from "lucide-react";
import { useStore } from "@/lib/pact-store";
import { money, potOf, settle } from "@/lib/pact-types";
import { Avatar, TierBadge } from "@/components/pact/TierBadge";
import { countdown } from "@/components/pact/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/challenge/$id")({
  head: () => ({
    meta: [
      { title: "Challenge — Potluck" },
      {
        name: "description",
        content: "Pick a side, watch the pot grow live and see exactly how the payout splits.",
      },
      { property: "og:title", content: "Challenge — Potluck" },
      {
        property: "og:description",
        content: "Pick a side, watch the pot grow live and see exactly how the payout splits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChallengeDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Challenge not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to discover
      </Link>
    </div>
  ),
});

function ChallengeDetail() {
  const { id } = Route.useParams();
  const { state, me, userById, join, resolve, comment } = useStore();
  const challenge = state.challenges.find((c) => c.id === id);
  const [tick, setTick] = useState(0);
  const [side, setSide] = useState<string | null>(null);
  const [amount, setAmount] = useState(25);
  const [text, setText] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!challenge) throw notFound();

  const host = userById(challenge.initiatorId)!;
  const isHost = host.id === me.id;
  const pot = potOf(challenge);
  const myEntries = challenge.entries.filter((e) => e.userId === me.id);
  const closed = challenge.deadline <= Date.now() || challenge.status !== "open";
  const preview = settle(challenge, side ?? challenge.options[0]?.id);
  void tick;

  const sideTotal = (optId: string) =>
    challenge.entries.filter((e) => e.optionId === optId).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="surface-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {challenge.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {countdown(challenge.deadline)}
            </span>
            {challenge.status !== "open" && (
              <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs text-accent">
                {challenge.status === "void" ? "Voided" : "Settled"}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight">{challenge.title}</h1>
          <p className="mt-3 whitespace-pre-line text-muted-foreground">{challenge.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Avatar user={host} size={36} />
            <div>
              <p className="text-sm">Hosted by @{host.username}</p>
              <p className="text-xs text-muted-foreground">
                {host.hosted} hosted · {host.disputes} disputes
              </p>
            </div>
            <TierBadge user={host} />
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied");
              }}
            >
              <Share2 className="size-4" /> Share
            </Button>
          </div>
        </div>

        <div className="surface-card mt-6 p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total pot (live)</p>
              <p className="font-display text-4xl font-bold neon-text tabular-nums">
                {money(pot)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="size-4" /> {challenge.entries.length} participants
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {challenge.options.map((o) => {
              const total = sideTotal(o.id);
              const won = challenge.winningOptionId === o.id;
              return (
                <div
                  key={o.id}
                  className={`rounded-lg border p-3 ${won ? "border-primary/50 bg-primary/10" : "border-border"}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {o.label} {won && "· winner"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {money(total)} · {pot ? Math.round((total / pot) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${pot ? (total / pot) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-medium">Who's in</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {challenge.entries.slice(-14).map((e) => (
                <span
                  key={e.id}
                  className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  @{e.username} · {money(e.amount)}
                </span>
              ))}
              {challenge.entries.length === 0 && (
                <span className="text-xs text-muted-foreground">No stakes yet — be first.</span>
              )}
            </div>
          </div>
        </div>

        <div className="surface-card mt-6 p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <MessageCircle className="size-4" /> Chat
          </h2>
          <div className="mt-3 space-y-3">
            {challenge.comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">@{c.username}</p>
                <p className="text-sm">{c.text}</p>
              </div>
            ))}
            {challenge.comments.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing said yet.</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              maxLength={300}
              placeholder="Say something…"
              onChange={(e) => setText(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!text.trim()) return;
                comment(challenge.id, text.trim());
                setText("");
              }}
            >
              Post
            </Button>
          </div>
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold">
            {closed ? "Entries closed" : "Pick your side"}
          </h2>

          {!closed && (
            <>
              <div className="mt-3 space-y-2">
                {challenge.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSide(o.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      side === o.id
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label htmlFor="stake" className="text-xs text-muted-foreground">
                  Stake ({money(challenge.minStake)} – {money(challenge.maxStake)})
                </label>
                <Input
                  id="stake"
                  type="number"
                  className="mt-1.5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              {side && (
                <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  If your side wins right now you'd take home about{" "}
                  <span className="text-primary">
                    {money(
                      (() => {
                        const winTotal = sideTotal(side) + amount;
                        const after = (pot + amount) * 0.95;
                        const prize = after * 0.8;
                        return winTotal > 0 ? (amount / winTotal) * prize : 0;
                      })(),
                    )}
                  </span>
                  . Odds move as more people join.
                </p>
              )}

              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={() => {
                  if (!side) return warn("Pick a side first.");
                  const err = join(challenge.id, side, amount);
                  if (err) return warn(err);
                  toast.success(`${money(amount)} locked in escrow`);
                }}
              >
                Join with {money(amount)}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Held in escrow until the challenge resolves.
              </p>
            </>
          )}

          {myEntries.length > 0 && (
            <div className="mt-4 border-t border-border pt-3 text-sm">
              <p className="text-muted-foreground">Your position</p>
              {myEntries.map((e) => (
                <p key={e.id}>
                  {challenge.options.find((o) => o.id === e.optionId)?.label} · {money(e.amount)}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="surface-card p-6 text-sm">
          <h2 className="text-lg font-semibold">Payout breakdown</h2>
          <Row label="Total pot" value={money(pot)} />
          <Row label="Platform fee (5%)" value={money(preview.platformFee)} />
          <Row label="Host cut (20% after fee)" value={money(pot * 0.95 * 0.2)} />
          <Row label="Split among winners" value={money(pot * 0.95 * 0.8)} />
          <p className="mt-3 text-xs text-muted-foreground">
            If it voids, everyone is refunded minus a 5% host fee, and the platform's 5% still
            applies.
          </p>
        </div>

        {isHost && challenge.status === "open" && (
          <div className="surface-card p-6">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert className="size-4" /> Resolve
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Settling pays everyone instantly using the engine above.
            </p>
            <div className="mt-3 space-y-2">
              {challenge.options.map((o) => (
                <Button
                  key={o.id}
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    resolve(challenge.id, o.id);
                    toast.success(`Settled — ${o.label} wins`);
                  }}
                >
                  {o.label} wins
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  resolve(challenge.id);
                  toast.success("Voided — everyone refunded");
                }}
              >
                Void (no winner)
              </Button>
            </div>
          </div>
        )}

        {!isHost && (
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Something wrong?</h2>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => toast.success("Dispute filed — an admin will review this challenge.")}
            >
              Raise a dispute
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex justify-between border-t border-border pt-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
