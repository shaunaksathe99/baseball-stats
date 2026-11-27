# Turning on online accounts (about 20 minutes, free)

Plate 450 Diary works fully offline. Online accounts are switched on only when you fill in two values in `js/cloud-config.js`.

**How it works:** a parent or guardian signs in with their email, gets a one-time code, and the diary is saved to a private row that only they can read. Edits sync on their own, and a new phone gets everything after signing in.

## 1. Create the project
1. Sign up at supabase.com (free) and create a project named `plate450`. Pick the region closest to your players.
2. **SQL Editor → New query**, paste all of `cloud/schema.sql`, press **Run**.

## 2. Make the email show a code (important)
Supabase's default email only has a link; the app needs a code.
1. **Authentication → Emails → Templates → Magic Link** (also edit **Confirm signup**).
2. Subject: `Your Plate 450 Diary code`
3. Body, for example:
   ```
   <h2>Approve a Plate 450 Diary account</h2>
   <p>Someone asked to save a Plate 450 Diary online with this email address as the parent or guardian.</p>
   <p>If that was you, or you approved it for your child, the approval code is: <b>{{ .Token }}</b></p>
   <p>If you did not expect this, do not share the code. Just ignore this email and nothing will be created. Players under 13 should not make accounts on their own.</p>
   ```
4. **Authentication → Sign In / Providers → Email**: keep "Enable email provider" on, turn **Confirm email** on, set the OTP length to 6.

## 3. Send from your own address (before launch)
Supabase's built-in sender is limited to a few emails per hour and is for testing only.
1. Create a free account with an email service (Resend, Brevo or Postmark) and verify `plate450.com`.
2. **Authentication → Emails → SMTP Settings**: enable custom SMTP and paste the service's details. Sender: `no-reply@plate450.com`.

## 4. Allow your site
**Authentication → URL Configuration**: set Site URL to `https://diary.plate450.com` and add the same under Redirect URLs.

## 5. Plug it into the app
**Project Settings → API**: copy the **Project URL** and the **anon public** key into `js/cloud-config.js`:
```js
window.DD_CLOUD = { url: 'https://xxxx.supabase.co', anonKey: 'eyJ...' };
```
Upload `js/cloud-config.js` to GitHub. The anon key is meant to be public. The data is protected by the rules in `schema.sql`. Never put the **service_role** key anywhere in the site.

## 6. Test it
Open the site → About → Sign in. Use your own email, enter the code, then check **Table Editor → diaries** for your row. Sign in on a second device to see it sync.

## How parent approval works
1. The app asks "Who is setting this up?". Anyone who says they are a player or under 18 is told to ask a parent, and the sign-in is blocked on that browser for 24 hours (this is a courtesy, not security: clearing site data resets it).
2. A parent or guardian gives their own email and ticks the consent box.
3. Supabase emails the approval code to that address. Nothing is stored until the code is entered.
4. The date and Terms version are saved with the diary (`cons`).

One account holds all of a family's players, up to 12, and they switch between them with the name button at the top.

Limit: email cannot prove who owns the inbox, so a child with their own email or a parent's unlocked phone could still approve it. This is the same "email plus consent" approach other family apps use. It is not formal verifiable parental consent.

## Before you launch (not code)
- `CONTACT_EMAIL` in `js/app.js` is set to Contact.Plate450@gmail.com. The Terms & Privacy page promises a way to ask what is stored or have it removed.
- Under-13 players: the sign-in screen says only a parent or guardian (18+) may create the account and stores only their email. This is a simple consent step. If you plan to market to young children or grow widely, have a lawyer review it against COPPA.
- Supabase is a data processor. Keep their terms (supabase.com/privacy) in mind when you describe who holds the data.

## What gets stored
The parent's email and one JSON copy of the diary (names or nicknames, optional city/state/ZIP, stats, goals, reviews, Player IDs, PIN hashes). Nothing else. Guests who never sign in send nothing anywhere.

## Good to know
- Newest save wins per game on the same device; when two devices change things at once, the two diaries are combined, so a game deleted on one device can come back.
- "Erase everything on this device" does not touch the online copy. **Delete my online account** does.

## My Idol list (optional)

1. In Supabase, open SQL Editor, paste the contents of `cloud/idols.sql`, and press Run.
2. Open Table Editor > `idols` to add, rename or remove players. Only signed-in users can read the list; nobody can change it from the app.
3. Signed-out visitors can still type any player's name. It stays on their device.


## Directory listing requests by email (optional, about 15 minutes)

The "Request a listing" form can send each request straight to a Resend inbox. The site never holds the Resend key: a small Supabase function does the sending. Every request is still reviewed by hand before anything is published, and the "Email it" and "Copy text" buttons keep working as a fallback.

1. **Resend, receiving address.** In Resend, open **Emails -> Receiving** and copy your receiving address, for example `listing@xxxx.resend.app`. (A custom domain works too if you add the MX record Resend shows.) Mail sent there appears in the Receiving tab.
2. **Resend, API key.** **API Keys -> Create API Key**, permission **Sending access**. Copy it once.
3. **Supabase table.** SQL Editor -> New query, paste all of `cloud/listing.sql`, Run. It holds only one-way scrambled IP hashes for the rate limit.
4. **Supabase CLI.** Install it (supabase.com/docs/guides/cli), then in this folder run `supabase login` and `supabase link --project-ref jjldpvkfnnoxrswlrcjl`.
5. **Secrets.** Run these, replacing the values:
   ```
   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
   supabase secrets set LISTING_TO=listing@xxxx.resend.app
   supabase secrets set TURNSTILE_SECRET=your-turnstile-secret-key
   supabase secrets set RATE_SALT=any-long-random-text
   ```
   Optional: `LISTING_FROM` (default `Plate 450 Diary <no-reply@mail.plate450.com>`) and `ALLOWED_ORIGINS` (default `https://diary.plate450.com,https://plate450.com`). To test from your computer, add `http://localhost:8000` to `ALLOWED_ORIGINS` and remove it afterwards.
6. **Deploy.** `supabase functions deploy listing-request --no-verify-jwt`. The flag is needed because the site's publishable key is not a JWT; the function checks Cloudflare Turnstile itself.
7. **Turnstile hostnames.** In Cloudflare, make sure `diary.plate450.com` is allowed for the same Turnstile widget the sign-in uses.
8. **Test.** On the live site open Learn -> Directory -> Request a listing, fill it in, tap Prepare, then Send. The email should appear in Resend's Receiving tab within a minute.

Protections: Cloudflare Turnstile, a hidden trap field that bots fill in, a limit of 3 requests per visitor per hour and 40 per day in total (so the free Resend plan, 100 emails a day shared with sign-in codes, is safe), and length and format checks on the server. If the function is not deployed or fails, the form shows a friendly message and the person can still use Email it or Copy text.
