import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  settle,
  type Challenge,
  type ChallengeStatus,
  type Txn,
  type User,
} from "./pact-types";

const KEY = "potluck-state-v1";
const uid = () => Math.random().toString(36).slice(2, 10);

interface State {
  users: User[];
  challenges: Challenge[];
  txns: Txn[];
  meId: string;
}

const HOUR = 3600_000;

function seed(): State {
  const now = Date.now();
  const users: User[] = [
    {
      id: "me",
      username: "nightowl",
      bio: "Weekend forecaster. Mostly right about rain.",
      avatarColor: "148",
      balance: 500,
      tier: "unverified",
      wins: 2,
      losses: 1,
      hosted: 0,
      disputes: 0,
    },
    {
      id: "u2",
      username: "oddsmith",
      bio: "Hosting fair markets since day one.",
      avatarColor: "205",
      balance: 3200,
      tier: "trusted",
      wins: 24,
      losses: 9,
      hosted: 41,
      disputes: 1,
    },
    {
      id: "u3",
      username: "chartgoblin",
      bio: "Charts, candles, chaos.",
      avatarColor: "85",
      balance: 900,
      tier: "verified",
      wins: 11,
      losses: 8,
      hosted: 7,
      disputes: 0,
    },
    {
      id: "u4",
      username: "pitchqueen",
      bio: "Football only. No exceptions.",
      avatarColor: "20",
      balance: 640,
      tier: "verified",
      wins: 6,
      losses: 6,
      hosted: 4,
      disputes: 1,
    },
    {
      id: "u5",
      username: "lofi_prophet",
      bio: "Music charts whisperer.",
      avatarColor: "320",
      balance: 220,
      tier: "unverified",
      wins: 1,
      losses: 3,
      hosted: 1,
      disputes: 0,
    },
  ];

  const mk = (
    id: string,
    title: string,
    description: string,
    category: Challenge["category"],
    initiatorId: string,
    labels: string[],
    hours: number,
    stakes: [string, string, number][],
    status: ChallengeStatus = "open",
  ): Challenge => {
    const options = labels.map((l, i) => ({ id: `${id}-o${i}`, label: l }));
    return {
      id,
      title,
      description,
      category,
      initiatorId,
      options,
      minStake: 10,
      maxStake: 500,
      deadline: now + hours * HOUR,
      resolution: "manual",
      status,
      entries: stakes.map(([userId, opt, amount], i) => ({
        id: `${id}-e${i}`,
        userId,
        username: users.find((u) => u.id === userId)!.username,
        optionId: options[Number(opt)]!.id,
        amount,
        at: now - i * 600_000,
      })),
      comments: [],
      createdAt: now - 8 * HOUR,
    };
  };

  const challenges: Challenge[] = [
    mk(
      "c1",
      "Bitcoin closes above $95k on Friday",
      "Resolution uses the Friday 23:59 UTC close on a major exchange index.",
      "Finance",
      "u2",
      ["Above $95k", "Below $95k"],
      36,
      [
        ["u3", "0", 250],
        ["u4", "1", 120],
        ["u5", "1", 60],
      ],
    ),
    mk(
      "c2",
      "It rains in Accra before Sunday noon",
      "Any measurable rainfall recorded in the city before 12:00 Sunday counts.",
      "Weather",
      "u3",
      ["It rains", "Stays dry"],
      20,
      [
        ["u2", "0", 200],
        ["u4", "0", 75],
        ["u5", "1", 90],
      ],
    ),
    mk(
      "c3",
      "Arsenal wins their next league match",
      "Draw counts as a loss for the yes side.",
      "Sports",
      "u4",
      ["Arsenal win", "Draw or loss"],
      50,
      [
        ["u2", "0", 400],
        ["u3", "1", 300],
      ],
    ),
    mk(
      "c4",
      "I run 50km this week — hold me to it",
      "Screenshot of the tracker posted Sunday night is the proof.",
      "Health",
      "u5",
      ["He makes it", "He folds"],
      70,
      [
        ["u3", "1", 40],
        ["u4", "0", 35],
      ],
    ),
    mk(
      "c5",
      "New album debuts at #1",
      "Official chart position published next Tuesday decides it.",
      "Music",
      "u2",
      ["Debuts #1", "Anywhere else"],
      96,
      [
        ["u5", "0", 55],
        ["u3", "1", 180],
      ],
    ),
  ];

  return { users, challenges, txns: [], meId: "me" };
}

interface Ctx {
  state: State;
  me: User;
  userById: (id: string) => User | undefined;
  deposit: (amount: number, method: string) => void;
  withdraw: (amount: number, method: string) => void;
  verify: () => void;
  createChallenge: (
    c: Omit<Challenge, "id" | "entries" | "comments" | "createdAt" | "status" | "initiatorId">,
  ) => string;
  join: (challengeId: string, optionId: string, amount: number) => string | null;
  resolve: (challengeId: string, winningOptionId?: string) => void;
  comment: (challengeId: string, text: string) => void;
  updateProfile: (patch: Partial<Pick<User, "username" | "bio">>) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Live pot: other players keep joining open challenges.
  useEffect(() => {
    if (!hydrated) return;
    const t = setInterval(() => {
      setState((s) => {
        const open = s.challenges.filter(
          (c) => c.status === "open" && c.deadline > Date.now(),
        );
        if (open.length === 0) return s;
        const c = open[Math.floor(Math.random() * open.length)]!;
        const bots = s.users.filter((u) => u.id !== s.meId && u.id !== c.initiatorId);
        const bot = bots[Math.floor(Math.random() * bots.length)]!;
        const opt = c.options[Math.floor(Math.random() * c.options.length)]!;
        const amount = Math.max(c.minStake, Math.round((10 + Math.random() * 90) / 5) * 5);
        return {
          ...s,
          challenges: s.challenges.map((x) =>
            x.id === c.id
              ? {
                  ...x,
                  entries: [
                    ...x.entries,
                    {
                      id: uid(),
                      userId: bot.id,
                      username: bot.username,
                      optionId: opt.id,
                      amount,
                      at: Date.now(),
                    },
                  ],
                }
              : x,
          ),
        };
      });
    }, 6000);
    return () => clearInterval(t);
  }, [hydrated]);

  const me = state.users.find((u) => u.id === state.meId)!;

  const addTxn = useCallback(
    (s: State, t: Omit<Txn, "id" | "at" | "userId"> & { userId?: string }): State => ({
      ...s,
      txns: [
        { id: uid(), at: Date.now(), userId: t.userId ?? s.meId, ...t } as Txn,
        ...s.txns,
      ],
    }),
    [],
  );

  const value = useMemo<Ctx>(() => {
    const patchUser = (s: State, id: string, fn: (u: User) => User): State => ({
      ...s,
      users: s.users.map((u) => (u.id === id ? fn(u) : u)),
    });

    return {
      state,
      me,
      userById: (id) => state.users.find((u) => u.id === id),
      deposit: (amount, method) =>
        setState((s) =>
          addTxn(patchUser(s, s.meId, (u) => ({ ...u, balance: u.balance + amount })), {
            type: "deposit",
            amount,
            note: `Deposit via ${method}`,
          }),
        ),
      withdraw: (amount, method) =>
        setState((s) => {
          const u = s.users.find((x) => x.id === s.meId)!;
          if (u.balance < amount) return s;
          return addTxn(patchUser(s, s.meId, (x) => ({ ...x, balance: x.balance - amount })), {
            type: "withdraw",
            amount,
            note: `Withdrawal to ${method}`,
          });
        }),
      verify: () =>
        setState((s) => patchUser(s, s.meId, (u) => ({ ...u, tier: "verified" }))),
      createChallenge: (draft) => {
        const id = uid();
        setState((s) => ({
          ...s,
          challenges: [
            {
              ...draft,
              id,
              initiatorId: s.meId,
              status: "open",
              entries: [],
              comments: [],
              createdAt: Date.now(),
            },
            ...s.challenges,
          ],
          users: s.users.map((u) => (u.id === s.meId ? { ...u, hosted: u.hosted + 1 } : u)),
        }));
        return id;
      },
      join: (challengeId, optionId, amount) => {
        let err: string | null = null;
        setState((s) => {
          const c = s.challenges.find((x) => x.id === challengeId);
          const u = s.users.find((x) => x.id === s.meId)!;
          if (!c) return s;
          if (amount < c.minStake || amount > c.maxStake) {
            err = `Stake must be between ${c.minStake} and ${c.maxStake}.`;
            return s;
          }
          if (u.balance < amount) {
            err = "Not enough in your wallet.";
            return s;
          }
          const next = patchUser(s, s.meId, (x) => ({ ...x, balance: x.balance - amount }));
          return addTxn(
            {
              ...next,
              challenges: next.challenges.map((x) =>
                x.id === challengeId
                  ? {
                      ...x,
                      entries: [
                        ...x.entries,
                        {
                          id: uid(),
                          userId: s.meId,
                          username: u.username,
                          optionId,
                          amount,
                          at: Date.now(),
                        },
                      ],
                    }
                  : x,
              ),
            },
            { type: "stake", amount, note: `Stake on "${c.title}"` },
          );
        });
        return err;
      },
      resolve: (challengeId, winningOptionId) =>
        setState((s) => {
          const c = s.challenges.find((x) => x.id === challengeId);
          if (!c || c.status === "resolved" || c.status === "void") return s;
          const result = settle(c, winningOptionId);
          let next: State = {
            ...s,
            challenges: s.challenges.map((x) =>
              x.id === challengeId
                ? {
                    ...x,
                    status: winningOptionId ? "resolved" : "void",
                    winningOptionId,
                  }
                : x,
            ),
          };
          for (const line of result.lines) {
            next = patchUser(next, line.userId, (u) => ({
              ...u,
              balance: u.balance + line.amount,
              wins: winningOptionId ? u.wins + 1 : u.wins,
            }));
            if (line.userId === s.meId) {
              next = addTxn(next, {
                type: winningOptionId ? "payout" : "refund",
                amount: line.amount,
                note: `${line.note} — ${c.title}`,
              });
            }
          }
          if (winningOptionId) {
            const losers = c.entries.filter((e) => e.optionId !== winningOptionId);
            for (const l of losers) {
              next = patchUser(next, l.userId, (u) => ({ ...u, losses: u.losses + 1 }));
            }
          }
          next = patchUser(next, c.initiatorId, (u) => ({
            ...u,
            balance: u.balance + result.initiatorCut,
          }));
          if (c.initiatorId === s.meId) {
            next = addTxn(next, {
              type: "payout",
              amount: result.initiatorCut,
              note: `Host cut — ${c.title}`,
            });
          }
          return next;
        }),
      comment: (challengeId, text) =>
        setState((s) => ({
          ...s,
          challenges: s.challenges.map((c) =>
            c.id === challengeId
              ? {
                  ...c,
                  comments: [
                    ...c.comments,
                    { id: uid(), username: me.username, text, at: Date.now() },
                  ],
                }
              : c,
          ),
        })),
      updateProfile: (patch) =>
        setState((s) => patchUser(s, s.meId, (u) => ({ ...u, ...patch }))),
    };
  }, [state, me, addTxn]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
