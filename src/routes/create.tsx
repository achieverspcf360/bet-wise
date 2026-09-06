import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/pact-store";
import { CATEGORIES, type Category, type ResolutionMethod } from "@/lib/pact-types";
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
        content: "Set the terms, sides, stake limits and deadline, then invite people to back a side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { createChallenge } = useStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Sports");
  const [options, setOptions] = useState(["", ""]);
  const [minStake, setMinStake] = useState(10);
  const [maxStake, setMaxStake] = useState(200);
  const [hours, setHours] = useState(48);
  const [resolution, setResolution] = useState<ResolutionMethod>("manual");

  const submit = () => {
    const labels = options.map((o) => o.trim()).filter(Boolean);
    if (title.trim().length < 8) return toast.error("Give the challenge a clearer title.");
    if (labels.length < 2) return toast.error("Add at least two sides people can pick.");
    if (minStake < 1 || maxStake < minStake) return toast.error("Check your stake limits.");

    const id = createChallenge({
      title: title.trim(),
      description: description.trim(),
      category,
      options: labels.map((label, i) => ({ id: `${Date.now()}-${i}`, label })),
      minStake,
      maxStake,
      deadline: Date.now() + hours * 3600_000,
      resolution,
    });
    toast.success("Challenge is live");
    navigate({ to: "/challenge/$id", params: { id } });
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
                onChange={(e) =>
                  setOptions(options.map((x, j) => (i === j ? e.target.value : x)))
                }
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
            <Label htmlFor="hrs">Closes in (hours)</Label>
            <Input
              id="hrs"
              type="number"
              className="mt-1.5"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
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
          Payouts: the platform keeps 5% of the pot, you keep 20% of what's left when a side wins.
          If it voids, everyone is refunded minus a 5% host fee that goes to you.
        </div>

        <Button className="w-full" size="lg" onClick={submit}>
          Publish challenge
        </Button>
      </div>
    </div>
  );
}
