# Madison Chinese Dance Academy Website

Static site for [madisonchinesedance.org](https://madisonchinesedance.org), served from the `docs/` folder on GitHub Pages.

## Editing content

Content lives in JSON files under `docs/content/`. Edit them either way:

- **On GitHub** — open the file at github.com, click the pencil icon, edit, and commit
- **Locally** — clone the repo, edit, and push to `main`

Changes go live on the next GitHub Pages deploy (usually within a minute). No npm or build step required.

**Performance photos** are not edited by hand — they are synced from Cloudflare R2 via `python scripts/scan-images.py sync`.

**Navigation:** menu labels live in `docs/content/header.json`. Do not delete or reorder menu items.

## How the site works

- **HTML shells** in `docs/pages/` and `docs/index.html`
- **Content** in `docs/content/*.json`
- **`docs/app.js`** loads JSON and renders the page in the browser
- **No build step** — push to `main` and GitHub Pages serves `docs/` directly

### Page content JSON shape

Each page JSON file uses a flat `content[]` array of typed blocks:

| Block type | Purpose |
|---|---|
| `hero` | Page title area (`heading`, `body`, optional `buttons`) |
| `text` | Subsection paragraph |
| `grid` | Multi-column cards (`columns`, `cards[]`) |
| `gallery` | Photo carousel placeholder (managed by `scan-images.py`) |
| `zeffy` | Embedded ticketing/donation form |

Page-level image keys (`galleryImages`, `homepageRunnerImages*`, etc.) stay at the JSON root and are updated by `scan-images.py` — do not edit them by hand.

## Project structure

```
docs/
  app.js, style.css, index.html
  pages/              # HTML shells (one per route)
  content/            # JSON content (edit directly)
    header.json       # Navigation
    footer.json
    announcements.json
    index.json        # Homepage (content[] blocks)
    gallery.json
    classes/, events/, get-involved/, splendid-china/
scripts/
  migrate-json-schema.py   # One-time sections → content[] migration
  generate-ai-context.py
  scan-images.py           # Sync performance photos from Cloudflare R2
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

## Route registry

`docs/content/site.json` maps route IDs to pages. Adding a new page requires a new HTML shell, JSON file, and route entry.

## Legacy Eleventy migration

An experimental Eleventy + GitHub Actions setup was tried and reverted. It remains on branch `feature/pages-cms-11ty` in git history if you ever want to revisit pre-rendered HTML.
