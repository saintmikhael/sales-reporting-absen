# Sales Reporting — Web Dashboard

A real Vite + React app wired to your Supabase backend. Owner/Admin gets the
full dashboard; a temporary "Sales test entry" page lets you create test
stores and visits until the Android app exists.

## 1. Install

```bash
npm install
```

## 2. Configure your Supabase connection

```bash
cp .env.example .env
```
Open `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
Both values are in your Supabase dashboard under **Settings → API**.

## 3. Run it

```bash
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`).

## 4. Try it out

1. Click **Daftar** (Register), choose **Owner / Admin**, fill in a phone number and password, submit. You'll land straight on the Owner dashboard (empty, since there's no data yet).
2. Open a second browser tab (or an incognito window) at the same URL, register again with **Tim Sales** this time.
3. In the Sales tab: add a test store, then click it and log a test visit (mark it as a sale, add a product or two).
4. Switch back to the Owner tab — within a few seconds the Ringkasan (Overview) and other views should update on their own (this uses Supabase Realtime, no refresh needed).

If you already promoted an account to `owner` directly in the Supabase Table Editor earlier, you can just log in with that account's phone/password instead of registering a new one.

## Notes

- **This is a temporary shape.** The "Sales test entry" page exists only because the Android app isn't built yet. Once it is, real Sales usage moves there, and this page can be deleted (or left in place as an internal QA tool — your call).
- **Photos** uploaded from the test entry page go into the same private `checkin-photos` Supabase Storage bucket the real app will use, so the Attendance view's photo previews work identically either way.
- **Realtime** subscribes to changes on `visits` and `stores`. If the dashboard doesn't seem to be live-updating, check the browser console for a Supabase Realtime connection error first.

## Deploying (when you're ready to share this beyond your own machine)

Push this folder to a GitHub repo, then import it into [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both auto-detect Vite. Add the same two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the hosting provider's project settings before the first deploy.
