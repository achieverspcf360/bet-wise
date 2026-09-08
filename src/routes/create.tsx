import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { warn } from "@/lib/warn";
import { useStore } from "@/lib/pact-store";
import {
  CATEGORIES,
  DURATION_UNITS,
  INITIATION_FEE,
  durationMs,
  money,
  type Category,
  type DurationUnit,
  type ResolutionMethod,
} from "@/lib/pact-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Challenge — Potluck" },
      {
        name: "description",
        content: "Set the terms, the sides, the stake limits and the deadline for your challenge.",
      },
      { property: "og:title", content: "Create a Challenge — Potluck" },
      {
        property: "og:description",
        content:
          "Set the terms, sides, stake limits and deadline, then invite people to back a side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { createChallenge, me } = useStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Sports");
  const [options, setOptions] = useState(["", ""]);
  const [minStake, setMinStake] = useState(10);
  const [maxStake, setMaxStake] = useState(200);
  const [duration, setDuration] = useState(48);
  const [unit, setUnit] = useState<DurationUnit>("hours");
  const [resolution, setResolution] = useState<ResolutionMethod>("manual");

  const submit = () => {
    const labels = options.map((o) => o.trim()).filter(Boolean);
    const window = durationMs(duration, unit);

    if (title.trim().length < 8) return warn("Give the challenge a clearer title (8+ characters).");
    if (description.trim().length < 20)
      return warn("Spell out the winning conditions — at least 20 characters.");
    if (labels.length < 2) return warn("Add at least two sides people can pick.");
    if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length)
      return warn("Each side needs a different label.");
    if (!Number.isFinite(minStake) || !Number.isFinite(maxStake) || minStake < 1)
      return warn("Minimum stake must be at least $1.");
    if (maxStake < minStake) return warn("Maximum stake can't be below the minimum.");
    if (maxStake > 100_000) return warn("Maximum stake is capped at $100,000.");
    if (!Number.isFinite(duration) || duration < 1)
      return warn("The challenge window must be at least 1 " + unit.slice(0, -1) + ".");
    if (window < 5 * 60_000) return warn("Give people at least 5 minutes to join.");
    if (window > 12 * 604_800_000) return warn("The window can't be longer than 12 weeks.");
    if (me.balance < INITIATION_FEE)
      return warn(`You need ${money(INITIATION_FEE)} in your wallet for the initiation fee.`);

    const result = createChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      options: labels.map((label, i) => ({ id: `${Date.now()}-${i}`, label })),
      minStake,
      maxStake,
      deadline: Date.now() + window,
      resolution,
    });
    if (!result.ok) return warn(result.error);
    toast.success(`Challenge is live — ${money(INITIATION_FEE)} initiation fee charged`);
    navigate({ to: "/challenge/$id", params: { id: result.id } });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">Create a challenge</h1>
      <p className="mt-2 text-muted-foreground">
        Be precise about how it resolves — vague terms are what cause disputes.
      </p>

      <div className="surface-card mt-6 space-y-5 p-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="mt-1.5"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gold closes above $2,500 on Friday"
          />
        </div>

        <div>
          <Label htmlFor="desc">Terms & winning conditions</Label>
          <Textarea
            id="desc"
            className="mt-1.5"
            rows={4}
            maxLength={800}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Exactly what counts as a win, which source settles it, and what makes it void."
          />
        </div>

        <div>
          <Label>Category</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  category === c
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Sides</Label>
          <div className="mt-1.5 space-y-2">
            {options.map((o, i) => (
              <Input
                key={i}
                value={o}
                maxLength={60}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => setOptions(options.map((x, j) => (i === j ? e.target.value : x)))}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOptions([...options, ""])}>
              Add side
            </Button>
            {options.length > 2 && (
              <Button size="sm" variant="ghost" onClick={() => setOptions(options.slice(0, -1))}>
                Remove last
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="min">Min stake</Label>
            <Input
              id="min"
              type="number"
              className="mt-1.5"
              value={minStake}
              onChange={(e) => setMinStake(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="max">Max stake</Label>
            <Input
              id="max"
              type="number"
              className="mt-1.5"
              value={maxStake}
              onChange={(e) => setMaxStake(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="dur">Closes in</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="dur"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
              <select
                aria-label="Time unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as DurationUnit)}
                className="rounded-md border border-border bg-input px-2 text-sm text-foreground"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <Label>Resolution method</Label>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["manual", "You settle it"],
                ["oracle", "Data source"],
                ["community", "Community vote"],
              ] as [ResolutionMethod, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setResolution(v)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  resolution === v
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          Opening a challenge costs a {money(INITIATION_FEE)} initiation fee. When a side wins, the
          platform keeps 5% of the pot and you keep 20% of what's left. If you void it, everyone is
          refunded in full, you earn nothing, you're charged {money(2)}, and the platform keeps
          2.5%.
        </div>

        <Button className="w-full" size="lg" onClick={submit}>
          Publish challenge · {money(INITIATION_FEE)} fee
        </Button>
      </div>
    </div>
  );
}
