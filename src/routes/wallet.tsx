import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useStore } from "@/lib/pact-store";
import { money } from "@/lib/pact-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Potluck" },
      {
        name: "description",
        content: "Top up, cash out and review every stake, payout and refund on your account.",
      },
      { property: "og:title", content: "Wallet — Potluck" },
      {
        property: "og:description",
        content: "Top up, cash out and review every stake, payout and refund.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

const METHODS = ["Card", "Bank transfer", "Mobile money"];

function WalletPage() {
  const { me, state, deposit, withdraw } = useStore();
  const [amount, setAmount] = useState(100);
  const [method, setMethod] = useState(METHODS[0]!);
  const [limit, setLimit] = useState(1000);

  const mine = state.txns.filter((t) => t.userId === me.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Wallet</h1>

      <div className="surface-card mt-6 p-6">
        <p className="text-sm text-muted-foreground">Available balance (play money)</p>
        <p className="font-display text-5xl font-bold neon-text tabular-nums">
          {money(me.balance)}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Move money</h2>
          <div>
            <Label htmlFor="amt">Amount</Label>
            <Input
              id="amt"
              type="number"
              className="mt-1.5"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  method === m
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (amount <= 0) return toast.error("Enter an amount above zero.");
                if (amount > limit) return toast.error(`Your deposit limit is ${money(limit)}.`);
                deposit(amount, method);
                toast.success(`${money(amount)} added`);
              }}
            >
              Deposit
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => {
                if (amount <= 0) return toast.error("Enter an amount above zero.");
                if (amount > me.balance) return toast.error("Not enough in your wallet.");
                withdraw(amount, method);
                toast.success(`${money(amount)} on its way to your ${method.toLowerCase()}`);
              }}
            >
              Withdraw
            </Button>
          </div>
        </div>

        <div className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Play it safe</h2>
          <div>
            <Label htmlFor="lim">Deposit limit per transaction</Label>
            <Input
              id="lim"
              type="number"
              className="mt-1.5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You'll be warned before any deposit above this. Take-a-break and self-exclusion tools
            arrive with real payments.
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Transaction history</h2>
      <div className="surface-card mt-3 divide-y divide-border">
        {mine.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">Nothing here yet.</p>
        )}
        {mine.map((t) => {
          const positive = t.type === "deposit" || t.type === "payout" || t.type === "refund";
          return (
            <div key={t.id} className="flex items-center gap-3 p-4">
              <span
                className={`rounded-full p-2 ${positive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {positive ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{t.note}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.at).toLocaleString()}
                </p>
              </div>
              <span
                className={`font-display tabular-nums ${positive ? "text-primary" : "text-foreground"}`}
              >
                {positive ? "+" : "−"}
                {money(t.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
