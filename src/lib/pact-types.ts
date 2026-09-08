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
export const INITIATOR_WIN_CUT = 0.2;
export const INITIATOR_VOID_CUT = 0.05;

export const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const potOf = (c: Challenge) => c.entries.reduce((s, e) => s + e.amount, 0);

export const tierLabel: Record<Tier, string> = {
  unverified: "Unverified",
  verified: "Verified",
  trusted: "Trusted",
};

/** Credibility score 0-100 from track record. */
export function credibility(u: User) {
  const base = u.tier === "trusted" ? 70 : u.tier === "verified" ? 45 : 15;
  const record = Math.min(25, u.hosted * 3 + u.wins * 2);
  const penalty = u.disputes * 6;
  return Math.max(0, Math.min(100, base + record - penalty));
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
  lines: PayoutLine[];
}

/**
 * Payout engine.
 * Win: platform takes 5% of pot, initiator takes 20% of the remainder,
 * the rest is split across winning-side stakes proportionally.
 * Void: every stake is refunded minus 5% to the initiator; the platform
 * still takes 5% of the pot.
 */
export function settle(c: Challenge, winningOptionId?: string): Settlement {
  const pot = potOf(c);
  const platformFee = pot * PLATFORM_FEE;
  const lines: PayoutLine[] = [];

  if (!winningOptionId) {
    let initiatorCut = 0;
    for (const e of c.entries) {
      const cut = e.amount * INITIATOR_VOID_CUT;
      initiatorCut += cut;
      lines.push({
        userId: e.userId,
        username: e.username,
        amount: e.amount - cut,
        note: "Refund (void, 5% host fee)",
      });
    }
    return { pot, platformFee, initiatorCut, lines };
  }

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

  return { pot, platformFee, initiatorCut, lines };
}
