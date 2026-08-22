# Madison Chinese Dance Academy Website

Static site for [madisonchinesedance.org](https://madisonchinesedance.org), served from the `docs/` folder on GitHub Pages.

## Editing content

Every page is a complete, hardcoded HTML file — content, header, footer, and gallery images all live in the page's markup. Edit the HTML directly:

- **On GitHub** — open the file at github.com, click the pencil icon, edit, and commit
- **Locally** — clone the repo, edit, and push to `main`

Changes go live on the next GitHub Pages deploy (usually within a minute). No npm or build step required.

**Shared layout:** the header, footer, navigation, and lightbox are duplicated in every page. If you rename a menu label or change footer info, update it in every HTML file (a find-and-replace across `docs/` works well).

**Performance photos** are not edited by hand — they are synced from Cloudflare R2 via `python scripts/scan-images.py sync` (see below).

## How the site works

- **Complete HTML pages** in `docs/index.html` and `docs/pages/**` (one per route)
- **`docs/app.js`** adds runtime behavior only: mobile nav, dropdown menus, gallery carousels and lightbox, year tabs, the Zeffy embed script, the star field, and the chatbot — it does not load any content
- **No build step, no JSON, no CMS** — push to `main` and GitHub Pages serves `docs/` directly

### Gallery sync regions

Gallery image lists are hardcoded in the HTML between marker comments, e.g.:

```html
<!-- sync:homepage-runner:begin -->
...carousel markup with <img> tags...
<!-- sync:homepage-runner:end -->
```

`scripts/scan-images.py sync` regenerates everything between the markers from R2; everything outside them is hand-edited content. Region ids:

| Region | File |
|---|---|
| `homepage-runner`, `homepage-runner-tall`, `homepage-runner-wide` | `docs/index.html` |
| `gallery-featured`, `gallery-archive` | `docs/pages/gallery.html` |
| `splendid-china-<year>` | `docs/pages/splendid-china/splendid-china-<year>.html` |

Adding a new Splendid China year requires a new HTML page (copy an existing year) with its own `splendid-china-<year>` sync region, plus links in the navigation menus.

## Project structure

```
docs/
  index.html               # Homepage (complete page)
  app.js                   # Runtime behaviors (nav, galleries, chatbot)
  style.css
  pages/                   # One complete HTML file per route
    classes/, events/, get-involved/, splendid-china/
scripts/
  gallery_markup.py        # Builds gallery HTML between the sync markers
  generate-ai-context.py   # Extracts text from the HTML into ai-context.md
  scan-images.py           # Sync performance photos from Cloudflare R2
ai-context.md              # Chatbot context (generated)
```

## Deployment

GitHub → **Settings** → **Pages** → Source: **Deploy from branch** → `main` → **`/docs`**

No GitHub Actions or npm required.

## Images (Cloudflare R2)

Performance photos live on R2 (`cdn.madisonchinesedance.org`). To sync from R2:

```bash
python scripts/scan-images.py sync
```

See `python scripts/scan-images.py --help` for homepage runner categorization.

## Chatbot

The MCDA Assistant uses a Cloudflare Worker. After content changes, regenerate context:

```bash
python scripts/generate-ai-context.py
```

Then deploy the worker with the updated `ai-context.md` if needed.

## History

- The site previously rendered pages client-side from JSON files (`docs/content/`) configured for Pages CMS. That setup was removed in favor of hardcoded HTML; the JSON-driven architecture remains in git history if you ever need it.
- An experimental Eleventy + GitHub Actions setup was also tried and reverted; it remains on branch `feature/pages-cms-11ty`.
