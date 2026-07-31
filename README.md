# Factoryfeed — Daily Ops Sheet (with server storage + admin archive)

A shared daily/weekly checklist for Factoryfeed's content and app operations. Unlike the single-file version, this is a small web app: every check, DM slot, and note your team enters is saved to a real database, and there's a password-protected **/admin** page where you can browse every day's report.

- **Date and Sheet No.** on the checklist are computed from the current date automatically — nothing to update by hand, they change on their own every day.
- **Prepared By: Yuvani** is shown on the checklist header and on every exported/copied report. To change the name later, edit `PREPARED_BY` in `lib/tasks.ts` and redeploy.
- **Reports are stored server-side** (Redis via Upstash), so the whole team shares the same checklist and history survives across devices and browsers.
- **/admin** is gated by a password you set — only you (and whoever you share it with) can browse past reports **and edit the task list itself**: rename any title/subtitle/item, add or delete items, add or delete whole sections, or restore the original list. Saved edits apply instantly for everyone using the checklist.

## Stack

- [Next.js](https://nextjs.org) (App Router) — frontend + API routes, deploys natively to Vercel
- [Upstash Redis](https://upstash.com) — stores each day's checklist state, connected through the **Vercel Marketplace**
- Plain cookie-based session for `/admin` — no third-party auth service needed

## 1. Push this to GitHub

```bash
git init
git add -A
git commit -m "Initial commit: Factoryfeed ops sheet"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

(Create an empty repository on GitHub first — no README/license, since this folder already has one.)

## 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo you just pushed.
2. Vercel will detect it as a Next.js app automatically — leave the build settings as-is.
3. Before the first deploy (or right after), add a database:
   - In the project, go to **Storage → Marketplace Database Providers**.
   - Choose **Upstash** → **Redis**, and connect it to this project.
   - This automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your project's environment variables — you don't need to copy these by hand.
4. Add two more environment variables yourself, under **Settings → Environment Variables**:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | the password you want for `/admin` |
   | `SESSION_SECRET` | any long random string (e.g. run `openssl rand -hex 32` locally) |
5. Deploy (or redeploy if it already ran once before you added the env vars).

Your team's checklist will be live at the URL Vercel gives you, e.g. `https://factoryfeed-ops.vercel.app`. The admin archive is at `https://factoryfeed-ops.vercel.app/admin`.

## 3. Using it day to day

- Open the main URL — the checklist for **today** loads automatically, shared by everyone who opens the link.
- Checking a box or typing a note saves to the server about a second after you stop typing/clicking (look for "Synced to server" at the top).
- **Download Report (PDF)** and **Copy as Text** work exactly as before, pulling from today's live state.
- Click **Admin — View Past Reports** at the bottom of the checklist (or go straight to `/admin`) and enter the admin password to browse every day that's been saved.

## Editing the task list

Go to `/admin`, log in, and switch to the **Edit Tasks** tab:

- Click into any title, subtitle, or item text to rename it.
- **+ Add Item** adds a new checklist line to a section (or to a group, for the Instagram Posting section).
- **Delete Section** removes a whole task block; the ✕ next to an item removes just that item.
- **+ Add Daily/Weekly Task Section** creates a brand-new task block.
- Click **Save Changes** to publish your edits — the checklist page picks them up on next load.
- **Restore Original Task List** reverts everything back to the built-in defaults.

The Instagram DM section's structure (pages and time slots) is intentionally fixed — only its title/subtitle are editable, since the time-slot format is baked into how DMs are tracked and reported.

## Changing the admin password later

Go to your Vercel project → **Settings → Environment Variables**, edit `ADMIN_PASSWORD`, and redeploy (or trigger **Redeploy** from the Deployments tab) for it to take effect. You never need to touch the code to change it.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in ADMIN_PASSWORD, SESSION_SECRET, and your Upstash credentials
npm run dev
```

Visit `http://localhost:3000`.

## Notes on security

- The admin password is checked **server-side** and never shipped to the browser — this is real authentication, unlike a password embedded in client-side JavaScript.
- The admin session is a signed, httpOnly cookie valid for 12 hours; logging out (or letting it expire) requires re-entering the password.
- Task wording (titles/items) lives in `lib/tasks.ts` in the code, not in an in-app editor — to change the task list itself, edit that file and redeploy (ask if you'd like an in-app editor added back for this).
