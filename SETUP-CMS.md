# All Model Repair — Pages CMS Setup

Your site is now fully editable through **Pages CMS** (https://app.pagescms.org) — no code, no commits. This guide walks you through it one step at a time.

Repo: **manoftheworldmedia/allmodelrepair** · Branch: **main** · Host: GitHub Pages (no build step)

---

## What you can edit from the CMS

| Section | File(s) | What it controls |
|---|---|---|
| **Images** | the `/img` folder | Every photo/logo on the site. Upload or swap here. |
| **Site Content** | `content.json` (EN) · `content.fa.json` (FA) | Hero headline, services, hours, phone, address, about text. |
| **FAQ** | `faq.json` (EN) · `faq.fa.json` (FA) | The on-page FAQ **and** the Google FAQ rich-result data — one edit updates both. |
| **Blog Posts** | `blog/posts/` (EN) · `blog/posts-fa/` (FA) | Add / edit / delete articles. |

Everything exists twice — once for **English** and once for **Farsi (فارسی)** — so you can edit both languages from the CMS.

---

## STEP 1 — Upload the site to GitHub

If you haven't already, upload **all** the files in this package to the repo root (so `index.html` sits at the top level, not inside a folder), and commit.

✅ **You should see:** in the repo's file list, `index.html`, `styles.css`, `cms.js`, `blog.js`, `content.json`, `faq.json`, `.pages.yml`, and the `img/` and `blog/` folders — all at the top level.

> ⚠️ **Mac users:** `.pages.yml` starts with a dot, so Finder hides it. If it's missing from the repo, don't worry — Step 4 has you paste it in directly.

---

## STEP 2 — Turn on GitHub Pages

1. Repo → **Settings** → **Pages**.
2. Under **Build and deployment**: Source = **Deploy from a branch**, Branch = **main** / **/ (root)** → **Save**.

✅ **You should see:** after ~1 minute, your site live at `https://www.allmodelrepair.com/` (or `https://manoftheworldmedia.github.io/allmodelrepair/`).

---

## STEP 3 — Connect Pages CMS

1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. Authorize Pages CMS for the **manoftheworldmedia/allmodelrepair** repository.
3. Open the repository inside Pages CMS.

✅ **You should see:** a left sidebar listing **Site Content (English)**, **Site Content (Farsi)**, **FAQ (English)**, **FAQ (Farsi)**, **Blog Posts (English)**, **Blog Posts (Farsi)**, and a **Media** section.

---

## STEP 4 — (Only if the sidebar is empty) Paste the configuration

If Pages CMS says it can't find a configuration, or the sidebar is empty:

1. In Pages CMS, open **Settings** → **Configuration** (the editor for `.pages.yml`).
2. Delete anything there, paste the **entire** config block from `pages-config.txt` (included in this package, identical to `.pages.yml`), and click **Save**.

✅ **You should see:** the sidebar populate with all six sections above.

> The exact configuration is also printed in the chat message that delivered this package — copy it from there if needed.

---

## STEP 5 — Edit text (hero, services, hours, about)

1. Sidebar → **Site Content (English)**.
2. Change, for example, the **Hero → Intro paragraph**, or edit **Hours**, then click **Save**.
3. For Farsi, do the same under **Site Content (Farsi / فارسی)**.

✅ **You should see:** Pages CMS commits the change; within ~1 minute, reload the live site (hard-refresh: ⌘⇧R / Ctrl⇧R) and your new wording appears. The orange word in the headline is the **"Headline — accent"** field.

---

## STEP 6 — Edit the FAQ

1. Sidebar → **FAQ (English)** → **Questions & Answers**.
2. Add a new item (pick a **Category**: General / Repairs / Detailing / Trust), type the question and answer, **Save**.

✅ **You should see:** on the live site's FAQ section the new question appears under its tab — **and** Google's FAQ structured data updates automatically (both are generated from this one file).

---

## STEP 7 — Add a blog post

1. Sidebar → **Blog Posts (English)** → **Add an entry**.
2. Fill in **Title, Date, Short description, Cover image** (pick/upload from Media), **Category, Tags**, and write the **Article body**. **Save**.

✅ **You should see:** the post appears on `blog.html` automatically (newest first) with its own page at `post.html?slug=…`. Farsi posts work the same way under **Blog Posts (Farsi)** and appear on `blog-fa.html`.

> New posts appear on their own — the blog reads the live list of files from GitHub, so there's nothing to rebuild.

---

## STEP 8 — Manage images

1. Sidebar → **Media** (the `/img` folder).
2. Drag in a new photo to upload, or replace an existing one.
3. To use an image, pick it from any **Cover image** field (blog) — its path is stored as `img/your-file.jpg`.

✅ **You should see:** uploaded files listed in Media, and selectable in image fields.

---

## Notes & good-to-knows

- **Hours open/closed badge** is calculated automatically from the **Hours** you enter. Keep the format like `8:30 AM – 5:00 PM` (or `Closed`) and it will keep working. Farsi accepts `۸:۳۰ صبح – ۵:۰۰ عصر` / `تعطیل`.
- **Phone number:** editing **Phone** in Site Content updates the click-to-call links and the two main displayed numbers. (The SMS/text button uses the **Text/SMS number** field.)
- **Don't rename** `content.json`, `faq.json`, the `img/` folder, or the `blog/posts/` folders — the site looks for those exact names.
- **Design is locked** on purpose — the CMS changes words, images, hours, FAQs, and posts, but not the layout, so it always looks right.
- After any edit, GitHub Pages takes up to a minute to publish; hard-refresh to see changes immediately.
