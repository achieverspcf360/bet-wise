import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import { money, potOf, type Challenge, type User } from "@/lib/pact-types";
import { Avatar, TierBadge } from "./TierBadge";

export function countdown(ts: number) {
  const ms = ts - Date.now();
  if (ms <= 0) return "closed";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
}

export function ChallengeCard({
  challenge,
  initiator,
}: {
  challenge: Challenge;
  initiator: User;
}) {
  const pot = potOf(challenge);
  const sides = challenge.options.map((o) => ({
    ...o,
    total: challenge.entries.filter((e) => e.optionId === o.id).reduce((s, e) => s + e.amount, 0),
  }));

  return (
    <Link
      to="/challenge/$id"
      params={{ id: challenge.id }}
      className="surface-card group block p-5 transition-all hover:neon-ring"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {challenge.category}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {countdown(challenge.deadline)}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:neon-text">
        {challenge.title}
      </h3>

      <div className="mt-3 flex items-center gap-2">
        <Avatar user={initiator} size={26} />
        <span className="text-sm text-muted-foreground">@{initiator.username}</span>
        <TierBadge user={initiator} />
      </div>

      <div className="mt-4 space-y-2">
        {sides.map((s) => (
          <div key={s.id}>
            <div className="flex justify-between text-xs">
              <span>{s.label}</span>
              <span className="text-muted-foreground">{money(s.total)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${pot ? (s.total / pot) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {challenge.entries.length} in
        </span>
        <span className="font-display text-xl font-bold neon-text tabular-nums">{money(pot)}</span>
      </div>
    </Link>
  );
}
