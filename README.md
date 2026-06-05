# All Model Repair — Website

Family-owned auto repair in Glendale, CA. Static website (HTML/CSS/JS — no build step).

## Pages
| File | Purpose |
|------|---------|
| `index.html` | Homepage (English) |
| `fa.html` | Homepage (Farsi / فارسی, RTL) |
| `blog.html` | Blog index |
| `brand-book.html` | Brand guidelines |
| `brand-book-print.html` | Print/PDF version of the brand book |

## Shared assets
- `styles.css` — main stylesheet (shared by all pages)
- `styles-rtl.css` — right-to-left overrides for the Farsi page
- `tweaks-panel.jsx`, `tweaks-app.jsx` — in-page "Tweaks" controls (accent color, headline font)
- `image-slot.js` — drag-and-drop image placeholders
- `assets/` — logo files and photos

## Running locally
It's a static site — just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing with GitHub Pages
1. Push these files to the `main` branch.
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main` / `root`.
3. Save. Your site goes live at `https://<username>.github.io/all-model-repair/`.

## Note on images
Some image areas (showcase gallery, blog thumbnails, Instagram tiles) are **drag-and-drop slots** that store dropped photos in the browser only — they are not committed to the repo. To make those images appear for all visitors, add real image files to `assets/` and reference them in the HTML.

## Contact
All Model Repair · 1305 S Glendale Ave, Ste 1, Glendale, CA 91205 · (818) 548-8242
