import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { warn } from "@/lib/warn";
import { useStore } from "@/lib/pact-store";
import { credibility, money } from "@/lib/pact-types";
import { Avatar, TierBadge } from "@/components/pact/TierBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Verification — Potluck" },
      {
        name: "description",
        content:
          "Your alias, bio, win/loss record and credibility tier, plus initiator verification.",
      },
      { property: "og:title", content: "Profile & Verification — Potluck" },
      {
        property: "og:description",
        content: "Manage your alias, track record and initiator verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const VERIFY_DEPOSIT = 250;

function ProfilePage() {
  const { me, state, updateProfile, verify, userById } = useStore();
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);

  const leaderboard = [...state.users].sort((a, b) => credibility(b) - credibility(a));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="surface-card mt-6 flex flex-wrap items-center gap-4 p-6">
        <Avatar user={me} size={64} />
        <div>
          <p className="font-display text-2xl font-bold">@{me.username}</p>
          <div className="mt-1">
            <TierBadge user={me} />
          </div>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-6 text-center">
          <Stat label="Wins" value={me.wins} />
          <Stat label="Losses" value={me.losses} />
          <Stat label="Hosted" value={me.hosted} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Public details</h2>
          <div>
            <Label htmlFor="u">Alias</Label>
            <Input
              id="u"
              className="mt-1.5"
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="b">Bio</Label>
            <Textarea
              id="b"
              className="mt-1.5"
              rows={3}
              maxLength={200}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              if (username.trim().length < 3) return warn("Alias is too short.");
              updateProfile({ username: username.trim(), bio: bio.trim() });
              toast.success("Profile updated");
            }}
          >
            Save
          </Button>
          <p className="text-xs text-muted-foreground">
            Only your alias is ever shown inside a challenge — never a legal name.
          </p>
        </div>

        <div className="surface-card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Initiator verification</h2>
          {me.tier === "unverified" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Verified hosts hold a {money(VERIFY_DEPOSIT)} deposit on the platform and pass an
                age (18+) and identity check. Verified badges draw far more participants.
              </p>
              <Button
                onClick={() => {
                  if (me.balance < VERIFY_DEPOSIT)
                    return warn(`You need ${money(VERIFY_DEPOSIT)} in your wallet first.`);
                  verify();
                  toast.success("You're verified — the badge shows on every challenge you host.");
                }}
              >
                Verify for {money(VERIFY_DEPOSIT)}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You're {me.tier === "trusted" ? "a trusted host" : "verified"}. Keep hosting clean,
              well-attended challenges to reach Trusted status.
            </p>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Credibility leaderboard</h2>
      <div className="surface-card mt-3 divide-y divide-border">
        {leaderboard.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 p-4">
            <span className="w-5 font-display text-muted-foreground">{i + 1}</span>
            <Avatar user={userById(u.id)!} size={32} />
            <span className="text-sm">@{u.username}</span>
            <TierBadge user={u} className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
