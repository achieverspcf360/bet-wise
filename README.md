# Bet Wise

Prompt: Peer-to-Peer Challenge/Betting App

Build a peer-to-peer challenge and betting platform where users create or join challenges on any topic — weather, finance, health, sports, music, entertainment, education, current events, or anything else that can be framed as a bet with a clear outcome.

User Roles
- Initiator: Creates a challenge, defines terms, winning conditions, deadline, and resolution method.
- Participant: Joins a challenge by depositing money on a chosen side/outcome.
- Any user can become an initiator, but initiators carry a credibility tier:
- Unverified — basic account, no track record
- Verified — completed registration + paid a minimum verification deposit + passed identity check (KYC)
- Established/Trusted — verified, plus strong track record (high challenge count, good turnout, low dispute/void rate, fair/timely resolutions)
- Credibility score/badges are visible on the initiator's profile and on every challenge card, so participants can judge whether to trust and join before depositing.

User Profile
- Username/alias, avatar, bio, wallet balance, challenge history, win/loss stats, credibility tier/score.
- Participants inside a challenge are shown by username/alias only — never full legal name.

Wallet & Deposits
- In-app deposit flow (card, bank transfer, or mobile money) to fund wallet before creating or joining challenges.
- Withdrawal flow back to original funding source.
- Verified initiator status requires a minimum deposit held on the platform.

Challenge Discovery
- Browse/search/filter by category, stake size, closing time, trending, and by initiator username.
- Each challenge shows a live-updating total pot that grows in real time as participants join and deposit.

Financial Logic (Core Payout Engine)

*Total pot* = sum of all participant deposits across all sides of a challenge.

1. Platform fee: 5% of the total pot is deducted for every challenge that is organized and played (win, lose, or void) — this goes to the platform, separate from the initiator's cut.
2. If the challenge resolves with a winning side:
- Initiator receives 20% of the total pot (after platform fee).
- Remaining balance is split among winning-side participants, proportional to each participant's deposit relative to total deposits on the winning side — regardless of how lopsided the split is (e.g., if only 1 of 10 participants lands on the losing side, or vice versa, payouts still calculate proportionally with no minimum-participant threshold).
3. If the challenge resolves with no winner (void/tie/unmet conditions):
- All participant deposits are refunded.
- A 5% fee is deducted from each refund and paid to the initiator (instead of the standard 20% win-cut).
- Platform's 5% organizing fee still applies to the total pot.

Core Features
- Authentication, KYC/verification for initiators
- Wallet (deposit, withdraw, balance, transaction history)
- Create Challenge flow: title, description, category, outcome options, min/max stake, deadline, resolution method (manual, oracle/API-based, or community vote)
- Join Challenge flow: browse, pick a side, deposit, confirm
- Escrow system holding all deposits securely until resolution
- Automated resolution & payout engine applying the logic above
- Dispute resolution mechanism
- Notifications: status updates, deadline reminders, payout confirmations
- Social features: comments/chat per challenge, sharing, leaderboards
- Admin dashboard: user management, transactions, disputes, compliance/reporting

Compliance
- Likely classified as gambling/betting in most jurisdictions — needs licensing, age verification (18+/21+), region-based restrictions, and responsible gambling tools (deposit limits, self-exclusion, spending alerts).
[9/6/2026 8:09 PM] Valentine Mensah: Technical Requirements
- Specify stack (e.g., React Native/Flutter frontend, Node.js/Django backend, PostgreSQL, escrow-compatible payment gateway, WebSocket for real-time pot updates)
- PCI-compliant handling of financial transactions

Screens
Home/Discover, Challenge Detail (with live pot), Create Challenge, Wallet, My Challenges, Profile/Settings, Initiator Verification, Admin Panel

---

Want this turned into a formatted PDF/Word doc, or broken into a phased build plan (MVP first, then advanced features)?

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/11878bf6-e786-4fe6-8d19-c881b9df6f25).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
