"""Build and maintain hardcoded gallery HTML inside the static pages.

The site uses no CMS: gallery images live directly in the HTML files between
marker comments. `scan-images.py sync` regenerates the regions between the
markers; everything outside them is hand-edited content.

Region markers look like:

    <!-- sync:homepage-runner:begin -->
    ...generated gallery markup...
    <!-- sync:homepage-runner:end -->

Region ids used by the site:
    homepage-runner / homepage-runner-tall / homepage-runner-wide  (docs/index.html)
    gallery-featured / gallery-archive                              (docs/pages/gallery.html)
    splendid-china-<year>                                           (docs/pages/splendid-china/*.html)
"""

from __future__ import annotations

import re
from pathlib import Path

MARKER_TEMPLATE = "<!-- sync:{sync_id}:{marker} -->"


def esc(value) -> str:
    """Escape text for use in HTML attributes and content."""
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def image_alt(image: dict, index: int, prefix: str = "Gallery image") -> str:
    return esc(image.get("alt") or f"{prefix} {index + 1}")


def image_src(image: dict) -> str:
    return esc(image.get("src") or "")


def image_thumb(image: dict) -> str:
    return esc(image.get("thumb") or image.get("src") or "")


def wrap_region(sync_id: str, markup: str) -> str:
    return (
        f"{MARKER_TEMPLATE.format(sync_id=sync_id, marker='begin')}\n"
        + markup.strip("\n")
        + f"\n{MARKER_TEMPLATE.format(sync_id=sync_id, marker='end')}"
    )


def replace_region(html: str, sync_id: str, markup: str) -> str:
    """Replace the marked region for `sync_id` with new markup.

    Returns the updated HTML, or None if the region is missing.
    """
    pattern = re.compile(
        re.escape(MARKER_TEMPLATE.format(sync_id=sync_id, marker="begin"))
        + r".*?"
        + re.escape(MARKER_TEMPLATE.format(sync_id=sync_id, marker="end")),
        re.DOTALL,
    )
    if not pattern.search(html):
        return ""
    return pattern.sub(lambda _: wrap_region(sync_id, markup), html)


def update_file(path: Path, sync_id: str, markup: str) -> bool:
    """Rewrite one sync region in `path`. Returns False if the region is absent."""
    html = path.read_text(encoding="utf-8")
    updated = replace_region(html, sync_id, markup)
    if not updated:
        return False
    if updated != html:
        path.write_text(updated, encoding="utf-8")
    return True


# ---------------------------------------------------------------------------
# Carousel building blocks (structure mirrors the original app.js renderer)
# ---------------------------------------------------------------------------


def build_wrapper_images(images: list[dict], indent: str = "\t\t\t\t") -> str:
    lines = [
        f'{indent}<img src="{image_src(image)}" alt="{image_alt(image, index)}">'
        for index, image in enumerate(images)
    ]
    return "\n".join(lines)


def build_controls(indent: str = "\t\t\t\t") -> str:
    return (
        f'{indent}<div class="gallery-controls" aria-label="Gallery controls">\n'
        f'{indent}\t<button class="prev" type="button" aria-label="Previous image">&#10094;</button>\n'
        f'{indent}\t<button class="next" type="button" aria-label="Next image">&#10095;</button>\n'
        f"{indent}</div>"
    )


def build_dots(images: list[dict], aria_label: str, indent: str = "\t\t\t") -> str:
    dots = [
        f'{indent}\t<button class="gallery-dot{" active" if index == 0 else ""}" type="button" '
        f'data-gallery-dot="{index}" aria-label="Go to image {index + 1}"></button>'
        for index in range(len(images))
    ]
    lines = [f'{indent}<div class="gallery-dots" data-gallery-dots aria-label="{esc(aria_label)}">']
    lines.extend(dots)
    lines.append(f"{indent}</div>")
    return "\n".join(lines)


def build_carousel(variant: str, images: list[dict], indent: str = "\t\t") -> str:
    variant_attr = f' data-gallery-variant="{esc(variant)}"' if variant else ""
    lines = [
        f'{indent}<div class="gallery-container"{variant_attr}>',
        f'{indent}\t<div class="gallery-wrapper" data-gallery-carousel>',
        build_wrapper_images(images, indent + "\t\t"),
        f"{indent}\t</div>",
        build_controls(indent + "\t"),
        f"{indent}</div>",
    ]
    return "\n".join(lines)


def build_runner_block(variant: str, images: list[dict], indent: str = "") -> str:
    """Runner carousel + dots, used on the homepage and Splendid China year pages."""
    prefix = indent + "\t"
    return "\n".join([
        build_carousel(variant, images, prefix),
        build_dots(images, "Gallery image selection", indent + "\t"),
    ])


def build_featured_section(images: list[dict], indent: str = "") -> str:
    """Featured gallery section for the Gallery page (carousel + dots + thumbnail strip)."""
    lines = [
        f'{indent}<section class="gallery-section gallery-section-featured" aria-label="Featured gallery photos">',
        build_carousel("featured", images, indent + "\t"),
        build_dots(images, "Featured gallery image selection", indent + "\t"),
        f'{indent}\t<div class="gallery-featured-thumbs" data-gallery-featured-thumbs aria-label="Featured gallery thumbnails">',
    ]
    for index, image in enumerate(images):
        active = " active" if index == 0 else ""
        lines.append(
            f'{indent}\t\t<button class="gallery-thumb{active}" type="button" data-gallery-thumb="{index}" '
            f'aria-label="Open {image_alt(image, index, "gallery image")}">'
        )
        lines.append(
            f'{indent}\t\t\t<img src="{image_thumb(image)}" alt="{image_alt(image, index)}" '
            f'loading="lazy" decoding="async">'
        )
        lines.append(f"{indent}\t\t</button>")
    lines.append(f"{indent}\t</div>")
    lines.append(f"{indent}</section>")
    return "\n".join(lines)


def _group_image_count(group: dict) -> int:
    return sum(len(event.get("images", [])) for event in group.get("events", []))


def _year_images(group: dict) -> list[tuple[dict, int]]:
    """Flatten a year group to (image, zero-based index within the year)."""
    flat: list[tuple[dict, int]] = []
    for event in group.get("events", []):
        for image in event.get("images", []):
            flat.append((image, len(flat)))
    return flat


def build_archive_tabs(groups: list[dict], indent: str = "\t") -> str:
    lines = [
        f'{indent}<div class="gallery-year-tabs" role="tablist" aria-label="Filter gallery by year">'
    ]
    for index, group in enumerate(groups):
        active = index == 0
        year = group.get("year") or f"Group {index + 1}"
        lines.append(
            f'{indent}\t<button class="gallery-year-tab{" active" if active else ""}" type="button" '
            f'role="tab" data-gallery-year-tab="{index}" aria-selected="{str(active).lower()}" '
            f'tabindex="{0 if active else -1}">'
        )
        lines.append(f'{indent}\t\t<span class="gallery-year-tab-label">{esc(year)}</span>')
        lines.append(
            f'{indent}\t\t<span class="gallery-year-tab-count" aria-hidden="true">'
            f"{_group_image_count(group)}</span>"
        )
        lines.append(f"{indent}\t</button>")
    lines.append(f"{indent}</div>")
    return "\n".join(lines)


def build_archive_panel(group: dict, index: int, indent: str = "\t") -> str:
    """One year of the archive: carousel + thumbnail grid, inside a switchable panel."""
    active = index == 0
    year = group.get("year") or f"Group {index + 1}"
    flat_images = _year_images(group)
    panel_class = "gallery-year-panel active" if active else "gallery-year-panel"
    hidden_attr = "" if active else " hidden"
    lines = [
        f'{indent}<div class="{panel_class}" data-gallery-year-panel="{index}"{hidden_attr}>',
        build_carousel("archive", [image for image, _ in flat_images], indent + "\t"),
        f'{indent}\t<div class="gallery-grid" data-gallery-grid aria-label="Gallery image thumbnails">',
    ]
    running_index = 0
    for event in group.get("events", []):
        event_name = event.get("event") or f"Gallery {year}"
        lines.append(f'{indent}\t\t<section class="gallery-event" aria-label="{esc(event_name)}">')
        lines.append(f"{indent}\t\t\t<h3>{esc(event_name)}</h3>")
        lines.append(f'{indent}\t\t\t<div class="gallery-event-grid">')
        for image in event.get("images", []):
            image_index = running_index
            running_index += 1
            lines.append(
                f'{indent}\t\t\t\t<button class="gallery-thumb" type="button" '
                f'data-gallery-thumb="{image_index}" '
                f'aria-label="Open {image_alt(image, image_index, "gallery image")}">'
            )
            lines.append(
                f'{indent}\t\t\t\t\t<img src="{image_thumb(image)}" alt="{image_alt(image, image_index)}" '
                f'loading="lazy" decoding="async">'
            )
            lines.append(f"{indent}\t\t\t\t</button>")
        lines.append(f"{indent}\t\t\t</div>")
        lines.append(f"{indent}\t\t</section>")
    lines.append(f"{indent}\t</div>")
    lines.append(f"{indent}</div>")
    return "\n".join(lines)


def build_archive_region(groups: list[dict]) -> str:
    """Archive section: year tabs plus one panel per year. First panel visible."""
    if not groups:
        return (
            '<section class="gallery-section gallery-section-archive" '
            'aria-label="Splendid China gallery photos">\n'
            '\t<p class="gallery-empty-message">No images are available for this gallery.</p>\n'
            "</section>"
        )
    parts = [
        '<section class="gallery-section gallery-section-archive" '
        'aria-label="Splendid China gallery photos">',
        build_archive_tabs(groups),
    ]
    for index, group in enumerate(groups):
        parts.append(build_archive_panel(group, index))
    parts.append("</section>")
    return "\n\n".join(parts)


def build_featured_region(images: list[dict]) -> str:
    if not images:
        return '<p class="gallery-empty-message">No images to display.</p>'
    return build_featured_section(images)
