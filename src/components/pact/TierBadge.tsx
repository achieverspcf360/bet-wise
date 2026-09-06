import { BadgeCheck, ShieldCheck, ShieldQuestion } from "lucide-react";
import { credibility, tierLabel, type User } from "@/lib/pact-types";
import { cn } from "@/lib/utils";

export function TierBadge({ user, className }: { user: User; className?: string }) {
  const Icon =
    user.tier === "trusted" ? BadgeCheck : user.tier === "verified" ? ShieldCheck : ShieldQuestion;
  const tone =
    user.tier === "trusted"
      ? "bg-primary/15 text-primary border-primary/40"
      : user.tier === "verified"
        ? "bg-accent/15 text-accent border-accent/40"
        : "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {tierLabel[user.tier]} · {credibility(user)}
    </span>
  );
}

export function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `oklch(0.8 0.17 ${user.avatarColor} / 0.25)`,
        color: `oklch(0.86 0.17 ${user.avatarColor})`,
        border: `1px solid oklch(0.8 0.17 ${user.avatarColor} / 0.5)`,
      }}
    >
      {user.username.slice(0, 2)}
    </span>
  );
}
