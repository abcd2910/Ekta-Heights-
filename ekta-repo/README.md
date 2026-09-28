# Ekta Heights — Daily Work

Internal execution and accountability tool for the Ekta Heights (Neela Infra) team.
Each person logs their day, pending work carries forward until it is closed, and
management sees the whole picture live.

Plain HTML, CSS and JavaScript. No build step, no framework, no `npm install`.

---

## What it does

**My Day** — each person picks their name once, then sees three numbers (closed
today, pending, overdue), their open work, and what they logged today. The work
category dropdown shows only that person's own responsibilities.

**Team** — today's totals, an escalation list ranked by severity, and a row per
person showing done · pending · overdue. Anyone who has logged nothing today
shows **Not submitted**.

**Management** — period selector, five headline KPIs, per-person performance with
completion / on-time / discipline, ageing buckets for open work, open work by
category, everything sitting 15+ days, and a CSV export.

Two rules are built into the form and cannot be worked around:

1. A pending item cannot be saved without a **reason**, a **next action** and a
   **due date**.
2. Pending items stay on the owner's screen until closed, and turn red the day
   they pass their due date.

---

## Files

```
public/
  index.html      the page
  styles.css      all styling (light + dark)
  config.js       >>> the only file you edit <<<
  store.js        the database layer
  app.js          application logic
supabase/
  schema.sql      run once to create the table
vercel.json       hosting config
```

---

## Setup

### 1. Database — already done

The Supabase project (`ekta-heights`, Mumbai region) exists and the
`work_items` table has been created, with row-level security enabled and
read / insert / update policies in place. There is deliberately **no delete
policy**, so nothing can be deleted through the app.

`public/config.js` is already filled in with the project URL and publishable
key. **You do not need to edit any file.**

`supabase/schema.sql` is kept in the repo as the record of what was created —
run it only if you ever rebuild the database from scratch.

### 2. Put it on GitHub

```bash
git init
git add .
git commit -m "Ekta Heights daily work tool"
git branch -M main
git remote add origin https://github.com/<you>/ekta-daily-work.git
git push -u origin main
```

### 3. Deploy on Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. Framework preset: **Other**.
3. Build command: leave **empty**.
4. Output directory: **`public`**.
5. Deploy.

That's it. Vercel redeploys automatically on every push.

### Running it locally first

```bash
cd public
python3 -m http.server 5173
```

Then open `http://localhost:5173`. Opening `index.html` as a file will not work —
it needs to be served over http.

---

## Giving people the link

| Person | Link | What they get |
|---|---|---|
| The six team members | `https://your-app.vercel.app` | Full app — log work, close items |
| CFO / management | `https://your-app.vercel.app/#admin` | Opens on Management, entry controls hidden |

The `#admin` link is a **convenience, not a security boundary** — anyone can
remove `#admin` from the URL. It exists so the CFO gets the right screen without
being shown buttons that aren't for him. See below for real access control.

---

## Locking it down

The app ships with the Supabase **anon** key in the page, so anyone who has the
site URL can read and write. For an internal tool on a private Vercel URL that is
usually acceptable, but understand what it means before sharing the link widely.

When you want it properly closed, in rough order of effort:

1. **Vercel password protection** — Project Settings → Deployment Protection.
   One password for the whole site. Takes two minutes and solves most of it.
2. **Supabase Auth** — add email login, then change the RLS policies in
   `schema.sql` from `using (true)` to `using (auth.role() = 'authenticated')`.
   The proper answer.
3. **Per-person accounts** — so the app knows who is logged in instead of asking
   them to pick a name. The natural next step after 2.

The schema deliberately has **no delete policy**, so nothing can be deleted
through the app in any of these configurations.

---

## Changing the team or their responsibilities

Everything about the six people lives at the top of `public/app.js`:

```js
const TEAM = [
  { id:'VAN', name:'Vandit', role:'Banking & Documentation',
    cats:['Banking','Dastavej','Banakhat','Ashant','Loan'] },
  ...
];
```

`ACTIONS` just below it maps each category to its expected actions. Edit, commit,
push — Vercel redeploys in about a minute. Existing data is untouched, because
items store the category as text.

**If you rename a category**, past items keep the old name. Either leave them (the
history stays true) or update them in the Supabase table editor.

---

## Known limits

- **Refresh is every 20 seconds**, not instant. Good enough for a team of six; if
  you want live updates, switch `store.js` to the Supabase realtime client.
- **Completion % is closed vs logged in the period.** An item logged on the 30th
  and closed on the 1st counts against the first month. Over a full month this
  evens out; over a single day it can look odd.
- **Ageing counts from the day an item was first logged**, so work the team was
  already carrying before go-live starts at zero. Ageing figures become truthful
  about a month in.
- **Name selection is per device**, stored in that browser. A shared phone will
  need the name switched at the top right.
- **No delete.** By design. Correct a wrong entry by closing it with a remark.

---

## Before you set targets

Do not set KPI targets on day one. Run it for two weeks with no targets, then set
them from what actually happened. Two things are still undefined and will make
Vandit's numbers meaningless until management decides them:

- the **stage list** for Dastavej, Banakhat, Ashant and loan files
- the **turnaround time** per work type, which is what a due date should be
  measured against

Until those exist, every due date is whatever the person typed.
