export type Tier = "unverified" | "verified" | "trusted";

export type Category =
  | "Sports"
  | "Finance"
  | "Weather"
  | "Health"
  | "Music"
  | "Entertainment"
  | "Education"
  | "Current Events"
  | "Other";

export const CATEGORIES: Category[] = [
  "Sports",
  "Finance",
  "Weather",
  "Health",
  "Music",
  "Entertainment",
  "Education",
  "Current Events",
  "Other",
];

export type ResolutionMethod = "manual" | "oracle" | "community";

export interface User {
  id: string;
  username: string;
  bio: string;
  avatarColor: string;
  balance: number;
  tier: Tier;
  wins: number;
  losses: number;
  hosted: number;
  /** Challenges this host settled with a clear winner. */
  settled?: number;
  /** Challenges this host voided. */
  voided?: number;
  disputes: number;
}

export interface Entry {
  id: string;
  userId: string;
  username: string;
  optionId: string;
  amount: number;
  at: number;
}

export type ChallengeStatus = "open" | "locked" | "resolved" | "void";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: Category;
  initiatorId: string;
  options: { id: string; label: string }[];
  minStake: number;
  maxStake: number;
  deadline: number;
  resolution: ResolutionMethod;
  status: ChallengeStatus;
  winningOptionId?: string;
  entries: Entry[];
  comments: { id: string; username: string; text: string; at: number }[];
  createdAt: number;
}

export interface Txn {
  id: string;
  userId: string;
  type: "deposit" | "withdraw" | "stake" | "payout" | "refund" | "fee";
  amount: number;
  note: string;
  at: number;
}

export const PLATFORM_FEE = 0.05;
/** Voided challenges are charged a lower platform fee. */
export const VOID_PLATFORM_FEE = 0.025;
export const INITIATOR_WIN_CUT = 0.2;
/** Hosts earn nothing on a voided challenge. */
export const INITIATOR_VOID_CUT = 0;
/** Flat charge to the host for voiding a challenge. */
export const VOID_PENALTY = 2;
/** Flat charge to open a challenge. */
export const INITIATION_FEE = 5;

/** Time units a host can use for the challenge window. */
export type DurationUnit = "minutes" | "hours" | "days" | "weeks";

export const DURATION_UNITS: { value: DurationUnit; label: string; ms: number }[] = [
  { value: "minutes", label: "Minutes", ms: 60_000 },
  { value: "hours", label: "Hours", ms: 3_600_000 },
  { value: "days", label: "Days", ms: 86_400_000 },
  { value: "weeks", label: "Weeks", ms: 604_800_000 },
];

export const durationMs = (value: number, unit: DurationUnit) =>
  value * (DURATION_UNITS.find((u) => u.value === unit)?.ms ?? 3_600_000);

export const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const potOf = (c: Challenge) => c.entries.reduce((s, e) => s + e.amount, 0);

export const tierLabel: Record<Tier, string> = {
  unverified: "Unverified",
  verified: "Verified",
  trusted: "Trusted",
};

/**
 * Credibility score 0-100. Driven by how a host's challenges ended:
 * cleanly settled challenges build trust, voided ones tear it down.
 */
export function credibility(u: User) {
  const base = u.tier === "trusted" ? 70 : u.tier === "verified" ? 45 : 15;
  const settled = u.settled ?? 0;
  const voided = u.voided ?? 0;
  const record = Math.min(25, settled * 4 + u.wins);
  const penalty = voided * 8 + u.disputes * 6;
  return Math.max(0, Math.min(100, base + record - penalty));
}

/** Share of a host's finished challenges that ended cleanly, 0-1. */
export function reliability(u: User) {
  const settled = u.settled ?? 0;
  const voided = u.voided ?? 0;
  const done = settled + voided;
  return done === 0 ? 1 : settled / done;
}

export interface PayoutLine {
  userId: string;
  username: string;
  amount: number;
  note: string;
}

export interface Settlement {
  pot: number;
  platformFee: number;
  initiatorCut: number;
  /** Flat charge taken from the host when a challenge is voided. */
  initiatorPenalty: number;
  lines: PayoutLine[];
}

/**
 * Payout engine.
 * Win: platform takes 5% of pot, initiator takes 20% of the remainder,
 * the rest is split across winning-side stakes proportionally.
 * Void: every stake is refunded in full, the host earns nothing and is
 * charged a $2 void penalty, and the platform takes 2.5% of the pot.
 */
export function settle(c: Challenge, winningOptionId?: string): Settlement {
  const lines: PayoutLine[] = [];

  const pot = potOf(c);

  if (!winningOptionId) {
    for (const e of c.entries) {
      lines.push({
        userId: e.userId,
        username: e.username,
        amount: e.amount,
        note: "Full refund (voided)",
      });
    }
    return {
      pot,
      platformFee: pot * VOID_PLATFORM_FEE,
      initiatorCut: 0,
      initiatorPenalty: VOID_PENALTY,
      lines,
    };
  }

  const platformFee = pot * PLATFORM_FEE;
  const afterPlatform = pot - platformFee;
  const initiatorCut = afterPlatform * INITIATOR_WIN_CUT;
  const prize = afterPlatform - initiatorCut;
  const winners = c.entries.filter((e) => e.optionId === winningOptionId);
  const winTotal = winners.reduce((s, e) => s + e.amount, 0);

  for (const e of winners) {
    lines.push({
      userId: e.userId,
      username: e.username,
      amount: winTotal > 0 ? (e.amount / winTotal) * prize : 0,
      note: "Winning payout",
    });
  }

  return { pot, platformFee, initiatorCut, initiatorPenalty: 0, lines };
}
