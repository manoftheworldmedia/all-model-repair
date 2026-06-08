# All Model Repair — Pages CMS Setup

Your site is now fully editable through **Pages CMS** (https://app.pagescms.org) — no code, no commits. This guide walks you through it one step at a time.

Repo: **manoftheworldmedia/allmodelrepair** · Branch: **main** · Host: GitHub Pages (no build step)

---

## What you can edit from the CMS

| Section | File(s) | What it controls |
|---|---|---|
| **Images** | the `/img` folder | Every photo/logo on the site. Upload or swap here. |
| **Site Content** | `content.json` | Hero, services, hours, phone, address, about — **English & Farsi side by side**. |
| **FAQ** | `faq.json` | The on-page FAQ **and** the Google FAQ rich-result data — **English & Farsi side by side**, one edit updates both. |
| **Blog Posts** | `blog/posts.json` | Add / edit / delete articles — **English & Farsi side by side**, one list. |

Site Content, FAQ, and Blog all use **paired fields**: every text field shows an **English** box and a **Farsi (فارسی)** box together, so you edit both languages in one place and keep translations in sync.Blog posts are kept as two separate lists (one per language).

---

## STEP 1 — Upload the site to GitHub

If you haven't already, upload **all** the files in this package to the repo root (so `index.html` sits at the top level, not inside a folder), and commit.

✅ **You should see:** in the repo's file list, `index.html`, `styles.css`, `cms.js`, `blog.js`, `content.json`, `faq.json`, `.pages.yml`, and the `img/` and `blog/` folders — all at the top level. (`blog/` contains `posts.json`.)

> ⚠️ **Mac users:** `.pages.yml` starts with a dot, so Finder hides it. If it's missing from the repo, don't worry — Step 4 has you paste it in directly.

---

## STEP 2 — Turn on GitHub Pages

1. Repo → **Settings** → **Pages**.
2. Under **Build and deployment**: Source = **Deploy from a branch**, Branch = **main** / **/ (root)** → **Save**.

✅ **You should see:** after ~1 minute, your site live at `https://allmodelrepair.com/`.

---

## STEP 3 — Connect Pages CMS

1. Go to **https://app.pagescms.org** and click **Sign in with GitHub**.
2. Authorize Pages CMS for the **manoftheworldmedia/allmodelrepair** repository.
3. Open the repository inside Pages CMS.

✅ **You should see:** a left sidebar listing **Site Content**, **FAQ**, **Blog Posts**, and a **Media** section.

---

## STEP 4 — (Only if the sidebar is empty) Paste the configuration

If Pages CMS says it can't find a configuration, or the sidebar is empty:

1. In Pages CMS, open **Settings** → **Configuration** (the editor for `.pages.yml`).
2. Delete anything there, paste the **entire** config block from `pages-config.txt` (included in this package, identical to `.pages.yml`), and click **Save**.

✅ **You should see:** the sidebar populate with all six sections above.

> The exact configuration is also printed in the chat message that delivered this package — copy it from there if needed.

---

## STEP 5 — Edit text (hero, services, hours, about)

1. Sidebar → **Site Content**.
2. Each field has an **English** box and a **Farsi / فارسی** box right next to each other. Edit either (or both), then click **Save**.
3. The orange word in the headline is the **"Headline — accent"** field.

✅ **You should see:** within ~1 minute, reload the live English site (`/`) and the Farsi site (`/fa.html`) — each shows its own language from the same entry (hard-refresh: ⌘⇧R / Ctrl⇧R).

---

## STEP 6 — Edit the FAQ

1. Sidebar → **FAQ** → **Questions & Answers**.
2. Add a new item (pick a **Category**: General / Repairs / Detailing / Trust), then type the **Question** and **Answer** in both the English and Farsi boxes. **Save**.

✅ **You should see:** on each live site the new question appears under its tab in that language — **and** Google's FAQ structured data updates automatically (both are generated from this one file).

---

## STEP 7 — Add a blog post

1. Sidebar → **Blog Posts** → **Posts** → **Add an entry**.
2. Fill in:
   - **URL slug** — lowercase-with-dashes, no spaces (e.g. `winter-tire-tips`). This becomes the page address.
   - **Date**, **Cover image** (pick/upload from Media), **Category**.
   - **Title**, **Short description**, and **Article body** — each has an **English** and a **Farsi** box.
3. **Save**.

✅ **You should see:** the post appears on `blog.html` automatically (newest first) with its own page at `post.html?slug=your-slug`. The Farsi site `blog-fa.html` shows the same post in Farsi. Leave a Farsi box empty and that post falls back to English on the Farsi site.

> Everything lives in one file (`blog/posts.json`), so there's nothing to rebuild and no folder of files to manage.

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
- **Don't rename** `content.json`, `faq.json`, `blog/posts.json`, or the `img/` folder — the site looks for those exact names.
- **Leaving a Farsi box empty** is fine — that field falls back to the English text on the Farsi site.
- **Design is locked** on purpose — the CMS changes words, images, hours, FAQs, and posts, but not the layout, so it always looks right.
- After any edit, GitHub Pages takes up to a minute to publish; hard-refresh to see changes immediately.
