# Madison Chinese Dance Academy Website

Static site for [madisonchinesedance.org](https://madisonchinesedance.org), served by GitHub Pages from the repository root. Each page is a folder with its own `index.html` (clean URLs like `/classes/beginner-dancers/`).

## Editing content

Every page is complete, hardcoded HTML. Edit it directly:

- **On GitHub** — open the file at github.com, click the pencil icon, edit, and commit
- **Locally** — clone the repo, edit, and push to `main`

Changes go live on the next GitHub Pages deploy (usually within a minute). No npm or build step required.

**Header and footer** are injected at load time by `js/navigation.js` — to rename a menu label, add a page, or change footer info, edit the data at the top of `js/navigation.js` once and it applies site-wide.

**Performance photos** are not edited by hand — they are synced from Cloudflare R2 via `python scripts/scan-images.py sync` (see below).

## How the site works

- **Pages** — one folder per route, each with a complete `index.html` (`/gallery/index.html` → `/gallery/`)
- **JavaScript** — one `<script type="module" src="/js/main.js">` per page; `js/main.js` imports and initializes one module per feature:
  - `navigation.js` — injects the shared header (with correct active-menu state) and footer, plus mobile nav toggle, dropdowns, and nav collapse
  - `announcement.js`, `starfield.js`, `zeffy.js` — announcement bar, decorative star field, Zeffy embed lazy-loading
  - `gallery.js` — gallery carousels, dots, year tabs, thumbnails, and lightbox
  - `chatbot.js` — MCDA Assistant chatbot
  - `utils.js` — shared helpers (selectors, HTML/markdown escaping, shuffle)
- **Styles** — `css/main.css` is the single `<link>`; it `@import`s one file per component (variables, base, buttons, header, sections, home, gallery, zeffy, footer, chatbot). To change where a style lives or add a part, update `css/main.css`. Each part file owns its own responsive media queries.
- **No build step, no JSON, no CMS** — push to `main` and GitHub Pages serves the repo root

### Adding a new page

1. Create `your-page/index.html` (copy an existing page for the shell: placeholders, lightbox, script tags)
2. Add an entry to `NAV_ITEMS` (and/or a footer column) in `js/navigation.js`

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
| `homepage-runner`, `homepage-runner-tall`, `homepage-runner-wide` | `index.html` |
| `gallery-featured`, `gallery-archive` | `gallery/index.html` |
| `splendid-china-<year>` | `splendid-china/<year>/index.html` |

Adding a new Splendid China year requires a new `splendid-china/<year>/index.html` page (copy an existing year) with its own `splendid-china-<year>` sync region, plus a `js/navigation.js` menu entry.

## Project structure

```
index.html                 # Homepage (/)
js/
  main.js                  # Entry point — imported by every page's single <script> tag
  navigation.js            # Shared header/footer data + injection, nav interactivity
  announcement.js          # Announcement dismiss + scrolling text
  starfield.js             # Decorative star field
  zeffy.js                 # Zeffy embed lazy-loading
  gallery.js               # Carousels, year tabs, lightbox
  chatbot.js               # MCDA Assistant chatbot
  utils.js                 # Shared helpers
css/
  main.css                 # Entry point — @imports the parts below
  variables.css            # Design tokens (:root)
  base.css                 # Reset, typography, container, skip link
  buttons.css, header.css, sections.css, home.css, gallery.css,
  zeffy.css, footer.css, chatbot.css
gallery/, programs/, classes/, donate/, events/, services/,
tickets/, get-involved/, splendid-china/     # One folder per page
scripts/
  gallery_markup.py        # Builds gallery HTML between the sync markers
  generate-ai-context.py   # Extracts text from the pages into ai-context.md
  scan-images.py           # Sync performance photos from Cloudflare R2
ai-context.md              # Chatbot context (generated)
```

## Deployment

GitHub → **Settings** → **Pages** → Source: **Deploy from branch** → `main` → **`/ (root)`**

Note: Pages serves the whole repo, so files like `README.md` and `scripts/` are publicly readable (secrets like `scripts/.env` and `r2-config.json` are gitignored and never published).

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
