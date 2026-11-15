# Dugout Diary

A free career diary for young ballplayers. Log games, track batting, pitching and fielding, set goals, earn badges.

- **No backend, no accounts.** Pure static HTML/CSS/JS, so it hosts anywhere (GitHub Pages, GoDaddy, Namecheap).
- **No PII.** Stores only a name or nickname, city + state (or ZIP), and the stats entered. No birthdates, emails, photos or analytics.
- **Data lives in the visitor's browser** (`localStorage`). Export/Import backup is in the About tab.
- Works offline once loaded (service worker) and can be added to a phone home screen.
- **Printable sheets (`#print`):** a one-game sheet and season grids (batting; pitching & fielding) to fill in by hand at the field. Boxes follow the Log screen's order. Works with no profile and prints on Letter or A4. Linked from Home, Log and About.
- **Baseball rule checks on entry:** impossible entries are blocked (hits > at-bats, hits + strikeouts > at-bats, 2B+3B+HR > hits, RBI with no plate appearance, earned runs > runs); unusual ones ask the player to double-check (sac flies > RBI, HR > RBI or runs, 9+ plate appearances, too few pitches for the strikeouts, too many innings, future dates). Walks, hit-by-pitch and sac flies are never counted as at-bats, and ERA uses earned runs only.
- **Shareable player cards:** an image (canvas, 1080x1350) plus a link that carries the card in the URL (`#card=...`). Nothing is uploaded. See `PLAN.md` for the growth and monetization plan.

## Files

```
index.html            page shell + bottom tab bar
css/style.css         theme (dark green / clay / gold)
js/stats.js           pure stat math: AVG, OBP, SLG, OPS, ERA, WHIP, FPCT, badges, goals
js/app.js             the app: views, forms, storage, import/export, share cards
js/content.js         content rules: cleaning, CSV, request parsing, safe article text
js/learn.js           Learn tab: trivia, quizzes, articles, glossary, directory
js/studio.js          Content Studio (#studio): the editor for non-technical staff
content/content.js    ALL editable content (Game IQ, trivia, quizzes, articles, glossary, directory)
sw.js, manifest.webmanifest, icon*.png/svg   offline + install-to-home-screen
tests/stats.test.js   unit tests:  node tests/stats.test.js
node tests/sim.test.js
node tests/content.test.js
```

## Deploy on GitHub Pages

1. Create a new GitHub repository (public is required for free Pages on personal accounts).
2. Upload everything in this folder to the repo root (keep `index.html` at the top level).
3. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. After a minute the site is live at `https://<username>.github.io/<repo>/`. All paths are relative, so the sub-folder URL works.

## Moving to GoDaddy / Namecheap later

It is only static files, so either:

- **Keep GitHub Pages, point your domain at it:** add a `CNAME` file containing your domain, set the domain in Settings → Pages, and add the DNS records GitHub documents (A records for the apex, a CNAME for `www`) at GoDaddy or Namecheap. Turn on "Enforce HTTPS".
- **Or host the files directly:** upload this folder's contents to the host's web root (`public_html`). Make sure HTTPS is enabled; the service worker needs it.

> **Important:** browsers store `localStorage` per web address. When the site moves from `username.github.io/...` to your own domain, players' saved stats do **not** follow. Before the move, add a banner asking families to **About → Export backup**, then **Import backup** on the new address.

## Privacy and legal notes

- Because no dates of birth or contact details are collected and nothing leaves the device, the site sidesteps most children's-privacy exposure (COPPA). If you later add accounts, sync, photos or analytics, revisit that and get a proper privacy policy.
- Don't use "Little League" (a registered trademark) in the site name, logo or domain; the footer disclaimer says the site is independent.

> Link previews: static hosting can't generate a per-card preview image, so shared links show the generic site preview. Add `og:image` with your absolute URL after deploying, or add a serverless function later.

## Ideas for later

- Optional sync via a free backend (Supabase/Firebase), with parent-owned accounts and no child PII.
- CSV import from other scoring apps, printable season card, coach/team view, pitch-count and rest-day helper.

## Tests

```
node tests/stats.test.js
```

## Innings, by-inning fielding and catchers
- Innings pitched is one box: type `3 1/3`, `3 2/3`, `4` (or `3.1`). No separate "extra outs" field.
- Fielding can be logged **Whole game** or **By inning** (position + putouts/assists/errors per inning) for kids who play several positions. Career stats roll up by position.
- When the position is **C**, Caught stealing (CS) and Catcher's interference (CI) steppers appear. CI also counts as an error, so the app gently warns if CI > E or CS > A. Print sheets include CS/CI boxes and columns.

## Player ID, PIN, and Terms & Privacy
- Every player gets a random **Player ID** (e.g. `K7M2-9QXA`) so two players named "Sam" are never confused. It shows on share cards, in the player switcher, and in backups. Imports skip players whose ID already exists.
- Optional per-player **PIN** (4 to 8 digits, PBKDF2-SHA256 with a random salt, stored only as a hash) plus a one-time **recovery code**. 5 wrong tries trigger a growing pause. It is a privacy lock, not encryption.
- There are still **no accounts, no emails, no server**. That is what keeps the app free of personal-data collection. Real cross-device accounts would need a server and an email or similar, which changes the privacy and children's-privacy picture; don't add one without legal review.
- **Terms & Privacy** live at `#terms` and must be accepted (checkbox) when the first player is created. Bump `TERMS_V` in `js/app.js` to ask everyone again. Set `CONTACT_EMAIL` in `js/app.js` before launch.
- Google Fonts was removed so the app makes no third-party requests.
- Have a lawyer review the Terms & Privacy text before a public launch.

## Pilot safeguards
- Asks the browser for persistent storage, shows "Last backup" in About, and shows a "Keep your stats safe" reminder on Home (3+ games with no backup, 10 new games since the last one, or 30 days). "Not now" snoozes it for a week. Phone browsers also get an Add to Home Screen tip.
- See PLAN.md for the pilot plan and the v2 roadmap.

## Game IQ simulator
- New **Game IQ** tab: 30 real game situations in 6 skill areas (baserunning, hitting, fielding, pitching & catching, rules, smart play). Each shows a diamond with runners, outs, score and count; the player picks the best play and learns why.
- 5-question rounds, mixed or by skill. Missed situations come back first. Ranks run Rookie to Hall of Famer, with XP and best streak. Progress is saved per player (and in backups). Guests can play without a card; their progress moves into the first card they create.
- Scenarios live in `js/sim.js`. Run `node tests/sim.test.js` after editing them: it checks that each has one best answer, a valid situation, and an explanation.

## Editing and undo
- **Edit** a game from Home (recent games), the Career game log, or "Fix a mistake in this game" right after saving. The form opens with the saved values and an "Editing a saved game" bar; the same validation applies, and the game is updated in place.
- **Delete** shows an **Undo** bar for a minute (until you reload).

## Editing content without a developer (Content Studio)

Everything on the Learn tab and every Game IQ situation lives in one file, `content/content.js`. Nobody edits it by hand. Instead:

1. Open the site and go to **About, Site editor** (or add `#studio` to the web address).
2. Pick a list (trivia, quizzes, knowledge base, glossary, directory, Game IQ situations). Add, change, hide or delete items with plain forms. Spreadsheet fans can download a list as CSV, edit it in Excel or Google Sheets, and upload it back.
3. Tap **Preview my changes** to see the draft on that device only.
4. Tap **Download content file**, then on github.com open the `content` folder, **Add file, Upload files**, drop in `content.js` (same name replaces the old one), and **Commit changes**. The site updates in a minute or two.

Edits are drafts saved in that browser. Nothing changes for visitors until the file is uploaded, and a mistake can be undone by uploading the previous version or by discarding the draft. Items that fail the rules get a plain-English message instead of breaking the site. Hidden items stay in the file but are not shown.

## Directory of trainers, coaches and travel teams

Learn, Directory shows listings from `content/content.js`. Adults can use **Get listed** to build a request (18+ confirmation, business info only). Nothing is sent automatically: they email or copy it to you (set `CONTACT_EMAIL` in `js/app.js` first). In the Studio choose **Paste a request**; it becomes a hidden listing you review, then Show. Outbound links open with `noopener noreferrer nofollow`. The Terms (version 2) say listings are not vetted or endorsed and parents make all contact. Have a lawyer review before launch.

## League levels (A, AA, AAA)

Trivia questions and Game IQ situations each have a league level, named like the minor leagues: **A** is the basics, **AA** is tougher, **AAA** is big-league smarts. Players pick a level (or All) before a round. In the Studio every trivia question and situation has a League level dropdown. In spreadsheets use the "Level (A/AA/AAA)" column; older files without it import as A.

## Brand: Plate 450

Plate 450 is the company; Dugout Diary is its product (a good home is a sub-domain such as dugout.plate450.com). Official artwork is in `brand/` (crest for light and dark backgrounds, lockup) and the colors are in `brand/palette.md`. The site header swaps the crest with the theme. Dark mode uses the palette's dark tokens and light mode its light tokens. In light mode gold is a fill only, and gold text uses the darker `#9A5F0F`. Icons (`icon.svg`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) come straight from the brand kit. Share cards draw the crest from `js/brand.js`.
