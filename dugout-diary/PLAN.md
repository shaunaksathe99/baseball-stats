# Dugout Diary: growth and monetization plan

Principle: **be genuinely useful to the player first, make sharing a side effect of using it, charge only for extras that sit on top of a free core.**

## Who we serve
- **Player (age ~7-14)** is the user whose pride drives sharing. They want a card that looks like a trading card and a record that grows.
- **Parent** is the operator (types in the stats, taps share, pays later). Everything must work one-handed in the bleachers.
- **Grandparents, relatives, teammates** are the audience. They are who the share links reach, and the most likely next users.

## Viral loops (built so far, all free, no server)
1. **Post-game share:** saving a game offers "Share this game", a 1080x1350 card ("2-for-4, 1 HR") ready for a family chat or story. The strongest trigger is right after a good game.
2. **Career and season cards:** the same card for a season or whole career, with an optional city toggle (off by default).
3. **Link that opens the card:** the stats ride inside the URL, so no backend or account is needed. The page ends with "Create my card", and every viewer sees the sign-up.
4. **Badges and hit streaks:** collectible, shareable milestones that give kids a reason to log every game.
5. **Install to home screen and offline:** logging works with bad ballpark reception.

## Loops to build next (still free)
- **Team code / team wall:** a coach or parent shares one link; teammates add their cards to a team page (needs a small backend; keep no-PII).
- **Challenge a friend:** "Beat my season line" link that compares two cards side by side.
- **Season recap ("Wrapped"):** an end-of-season animated recap, the biggest annual share moment.
- **Milestone moments:** automatic cards for first hit, first homer, first strikeout, first win.
- **Link previews:** serve a per-card Open Graph image (needs a tiny serverless function) so shared links show the card in iMessage, WhatsApp and Facebook.
- **Referral nudge:** "Share with a teammate" after the third logged game.

## Monetization ladder (only after real usage; core tracker stays free)
| Step | Offer | Why it works |
|---|---|---|
| 1 | **Printed cards, posters, season books** (print-on-demand) | Parents already buy these; zero inventory; the card art is already built |
| 2 | **Dugout Diary Pro** (about $2-5/month or $20-30/year): cloud sync across devices, unlimited players, video highlight links, advanced charts (spray, splits), season PDF, ad-free card themes | Sync is the first real need once a family has 2 devices |
| 3 | **Team plan** for coaches and leagues: shared rosters, team page, schedules, a pitch-count and rest-day tracker | Coaches are the distribution channel; leagues pay per team |
| 4 | **Featured directory listings** for trainers and travel teams (free to be listed; paid to be pinned or highlighted, clearly labeled). **Local sponsors** (sporting goods, pizza, dentists) on team pages or cards, opt-in, no tracking of children | Leagues already run on sponsor money |
| 5 | **Recruiting profile** for older players (HS/college) with verified stats | Where families will pay the most; goes after GameChanger's paywalled athlete profiles |

## Guardrails (keep trust, it is the moat)
- No dates of birth, emails, photos or ad tracking for players under 13. Sharing is always an explicit parent action.
- If accounts or sync are added: parent-owned accounts only, a real privacy policy, and a COPPA review before launch.
- Don't use "Little League" or other league trademarks in branding. Always keep the independence disclaimer.
- Stats are self-reported, so label them that way. Verified stats can be a later paid feature.

## Metrics that tell us it is working
- Activation: % of new players who log a first game in the first session.
- Retention: games logged per player per week during season; week-4 return rate.
- Virality (k-factor): shares per active player x % of shared-link viewers who create a card. Target above 0.3 per season before spending on growth.
- Early signal: share-button taps after saving a game.

## Pilot (v1), then v2

### v1 pilot: one team or league, free, no backend
- Goal: prove players actually log games, find the rough edges, and learn what they ask for. Do not market widely yet.
- Data-loss safeguards (done): persistent-storage request, "last backup" in About, backup reminder (3+ games with no backup, 10 new games, or 30 days), Home Screen install tip on phones.
- Pilot setup: hand the link to 1 coach and 8 to 15 families. Show them Export backup and Add to Home Screen at the first practice. Pre-print game sheets for the dugout.
- Measure with cookieless counts (GoatCounter): visitors, players created, games logged, share taps. Ask for feedback after week 2 and week 6.
- Exit criteria to start v2: at least 60% of pilot players log 3+ games, at least 5 organic shares, and the same two or three feature requests keep coming up (likely sync and team reports).
- Before pilot: set `CONTACT_EMAIL`, have a lawyer skim Terms & Privacy, deploy from `main` on GitHub Pages.

### v2 scope (narrow first release: parent accounts + cloud backup/sync)
1. **Parent-owned accounts.** Parent signs up with an email; kids never create accounts. Kids' cards live under the parent's account.
2. **Verifiable parental consent** (COPPA) before any child's data is stored server-side. Pick a consent method with counsel (e.g. a small card charge or signed form).
3. **Sync + cloud backup.** Keep local-first: the app works offline, uploads the same JSON the backup file uses, and the Player ID is the stable key. Conflict rule: last write wins per game id.
4. **Recovery.** Email login link, no passwords. PIN stays a local convenience lock.
5. **Privacy changes.** New Privacy Notice (server storage, data deletion on request, retention), a delete-my-account button, a data export.
6. **Hosting.** Managed backend (e.g. Supabase or Firebase) with row-level security so a family only reads its own rows. No analytics SDKs, no ads.

### v2.1 and later
- Team reports: coach team page and roster, season leaders, printable PDF, team code to join (opt-in by the parent).
- Pro tier (sync across devices, unlimited players, season PDF) and Team plan, per the monetization ladder above.
- Challenge links and season recap from the loops list.

### Game IQ ideas (next)
- More scenarios per skill (aim for 100+), a Pro level, and seasonal sets. Have a coach review the bank before launch.
- Team challenge: a coach picks a round, the team compares scores (fits the v2 team features).
- Game IQ badge and a line on the share card.
