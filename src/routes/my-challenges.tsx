import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/pact-store";
import { money, potOf } from "@/lib/pact-types";
import { ChallengeCard } from "@/components/pact/ChallengeCard";

export const Route = createFileRoute("/my-challenges")({
  head: () => ({
    meta: [
      { title: "My Challenges — Potluck" },
      {
        name: "description",
        content: "Everything you've hosted or backed, with stakes, live pots and settled results.",
      },
      { property: "og:title", content: "My Challenges — Potluck" },
      {
        property: "og:description",
        content: "Track the challenges you host and the sides you've backed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyChallenges,
});

function MyChallenges() {
  const { state, me, userById } = useStore();
  const hosted = state.challenges.filter((c) => c.initiatorId === me.id);
  const joined = state.challenges.filter(
    (c) => c.initiatorId !== me.id && c.entries.some((e) => e.userId === me.id),
  );
  const staked = state.challenges
    .flatMap((c) => c.entries.filter((e) => e.userId === me.id))
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">My challenges</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          ["Hosted", String(hosted.length)],
          ["Joined", String(joined.length)],
          ["Total staked", money(staked)],
        ].map(([label, value]) => (
          <div key={label} className="surface-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <Section title="Hosted by you" items={hosted} />
      <Section title="You're in" items={joined} />
      {hosted.length + joined.length === 0 && (
        <p className="mt-10 text-center text-muted-foreground">
          You haven't backed anything yet. Head to Discover and pick a side.
        </p>
      )}
    </div>
  );

  function Section({ title, items }: { title: string; items: typeof state.challenges }) {
    if (items.length === 0) return null;
    return (
      <>
        <h2 className="mt-8 text-lg font-semibold">
          {title}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            · {money(items.reduce((s, c) => s + potOf(c), 0))} in play
          </span>
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <ChallengeCard key={c.id} challenge={c} initiator={userById(c.initiatorId)!} />
          ))}
        </div>
      </>
    );
  }
}
