# Factoryfeed — Daily Ops Sheet

A single-page, self-contained checklist for Factoryfeed's daily and weekly content/app operations — app video posting, script writing, Instagram posting (Official / India / Sourcing), stories, communities, YouTube Shorts, and Instagram DM checks.

No build step, no backend, no dependencies beyond two Google Fonts. Open `index.html` in any browser.

## Features

- **Daily checklist** — auto-resets each new calendar day
- **Weekly checklist** — auto-resets each new ISO week
- **Notes field on every task** — for blockers, context, or who covered it
- **Instagram DM tracker** — 10 AM / 2 PM / 6 PM slots across Official, India, and Sourcing pages
- **Download Report (PDF)** — opens a print-formatted daily report you can save as PDF and send to your team
- **Copy as Text** — copies a plain-text summary for quick sharing over WhatsApp or email
- **Admin edit mode** — password-gated inline editing of task titles, sub-labels, and items; add or delete tasks and sections
- Everything saves to the browser's local storage automatically — no server, no account needed

## Getting started

1. Download or clone this repo.
2. Open `index.html` directly in a browser (double-click it, or drag it into Chrome).
3. Bookmark the file locally, or host it (see below) so your team can reach it from one link.

## Hosting it for your team

The simplest option is **GitHub Pages**:

1. Push this repo to GitHub (see commands below).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — GitHub will publish it at `https://<your-username>.github.io/<repo-name>/`.

Share that link with your team so everyone opens the same page daily.

## Admin edit mode

Click the **🔒 Admin** button and enter the password to unlock inline editing of tasks (rename, add, or delete items and sections). The default password is set inside `index.html` — search for `ADMIN_PASSWORD` near the top of the `<script>` block and change it to your own before sharing the repo or the hosted link.

**Note:** this is a client-side-only password meant to stop accidental edits by teammates, not real security — anyone who views the page source can find it. Don't rely on it to protect sensitive information.

## Pushing to your own GitHub account

From inside this folder:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

(Create the empty repository on GitHub first, without a README, then run the commands above.)

## License

MIT — see `LICENSE`.
