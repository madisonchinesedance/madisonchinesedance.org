#!/usr/bin/env python3
"""
Generate ai-context.md from the static HTML pages.

Walks docs/index.html and docs/pages/**/*.html, extracts the text content
(headings, paragraphs, buttons, gallery counts, embedded forms), and compiles
it into a single markdown file used as context for the AI chatbot.

Usage:
    python scripts/generate-ai-context.py
"""

import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_FILE = ROOT / "ai-context.md"

# site pages live at the repo root: index.html plus one folder per page
EXCLUDED_DIRS = {"scripts", ".git", ".vscode", "cloudflare-r2-import", "node_modules"}

VOID_TAGS = {"meta", "link", "img", "br", "input", "hr", "source"}


class Node:
    __slots__ = ("tag", "attrs", "children", "text")

    def __init__(self, tag, attrs):
        self.tag = tag
        self.attrs = {k: (v if v is not None else "") for k, v in attrs}
        self.children = []
        self.text = ""


class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", [])
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if data.strip():
            self.stack[-1].text += " " + data.strip()


def parse_file(path: Path) -> Node:
    parser = Parser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.root


def classes(node: Node) -> set:
    return set(node.attrs.get("class", "").split())


def text_content(node: Node) -> str:
    parts = [node.text.strip()]
    for child in node.children:
        parts.append(text_content(child))
    return " ".join(p for p in parts if p).strip()


def find_all(node: Node, pred, results=None):
    if results is None:
        results = []
    if node.tag != "#root" and pred(node):
        results.append(node)
    for child in node.children:
        find_all(child, pred, results)
    return results


def strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


# ---------------------------------------------------------------------------
# Page extraction
# ---------------------------------------------------------------------------


def extract_page_section(path: Path) -> tuple[str, list[str]] | None:
    root = parse_file(path)
    title_node = next(iter(find_all(root, lambda n: n.tag == "title")), None)
    if title_node is None:
        return None
    title = text_content(title_node).strip()
    display_title = title.split("|")[0].strip() if "|" in title else title

    meta = next(
        iter(
            find_all(
                root,
                lambda n: n.tag == "meta" and n.attrs.get("name") == "description",
            )
        ),
        None,
    )
    description = meta.attrs.get("content", "") if meta else ""

    main = next(iter(find_all(root, lambda n: n.tag == "main")), None)
    if main is None:
        return None

    lines: list[str] = []
    if description:
        lines.append(description)
        lines.append("")

    skip_within = {"gallery-wrapper", "gallery-featured-thumbs", "gallery-event-grid"}

    def walk(node: Node, in_skip: bool = False):
        cls = classes(node)
        skipped = in_skip or bool(cls & skip_within)
        if not skipped:
            if node.tag == "h1":
                lines.append("")
                lines.append(f"# {text_content(node)}")
                lines.append("")
            elif node.tag in ("h2", "h3", "h4", "h5", "h6"):
                lines.append("")
                lines.append(f"#### {text_content(node)}")
                lines.append("")
            elif node.tag == "p":
                para = text_content(node)
                if para:
                    lines.append(para)
                    lines.append("")
            elif node.tag == "a" and "btn" in cls:
                href = node.attrs.get("href", "")
                label = text_content(node)
                if label:
                    lines.append(f"- **{label}**" + (f" ({href})" if href else ""))
            elif node.tag == "div" and "data-form-url" in node.attrs:
                form_url = node.attrs.get("data-form-url", "")
                if form_url:
                    lines.append(f"- Embedded form: {form_url}")
                    lines.append("")

        if "gallery-section" in cls:
            images = find_all(node, lambda n: n.tag == "img")
            if images:
                lines.append(f"- Gallery with {len(images)} images")
                lines.append("")
            return

        for child in node.children:
            walk(child, skipped)

    walk(main)

    if not any(line.strip() for line in lines):
        return None
    return display_title, lines


def unescape_js_string(value: str) -> str:
    return value.replace("\\'", "'").replace('\\"', '"').replace("\\n", "\n")


def read_nav_js() -> str:
    nav_path = ROOT / "js" / "navigation.js"
    if not nav_path.exists():
        return ""
    return nav_path.read_text(encoding="utf-8")


def extract_footer_info(nav_source: str):
    """Mission statement and contact lines from the FOOTER data in js/navigation.js."""
    mission = ""
    mission_match = re.search(r"mission:\s*'((?:\\.|[^'\\])*)'", nav_source)
    if mission_match:
        mission = unescape_js_string(mission_match.group(1))

    contacts = []
    operations_match = re.search(r"operations:\s*\[(.*?)\]", nav_source, re.DOTALL)
    if operations_match:
        for label in re.findall(r"label:\s*'([^']+)'", operations_match.group(1)):
            contacts.append(f"- {label}")
    return mission, contacts


def extract_navigation(nav_source: str) -> list[str]:
    """Navigation summary from the NAV_ITEMS data in js/navigation.js.

    NAV_ITEMS uses a controlled format: top-level entries are indented one
    tab from the array (which closes at column 0), dropdown children one
    level deeper again.
    """
    lines = []
    start = nav_source.find("const NAV_ITEMS = [")
    if start == -1:
        return lines
    end = nav_source.find("\n];", start)
    block = nav_source[start:end]

    top_pattern = re.compile(r"^\t\{", re.M)
    child_label_pattern = re.compile(r"^\t\t\t\{[^}]*?label:\s*'([^']+)'", re.M)

    matches = list(top_pattern.finditer(block))
    for index, match in enumerate(matches):
        item_start = match.start()
        item_end = matches[index + 1].start() if index + 1 < len(matches) else len(block)
        item = block[item_start:item_end]

        label_match = re.search(r"label:\s*'([^']+)'", item)
        if not label_match:
            continue
        label = label_match.group(1)

        if "items:" in item:
            lines.append(f"### {label}")
            child_labels = child_label_pattern.findall(item)
            if not child_labels:
                child_labels = re.findall(r"label:\s*'([^']+)'", item)[1:]
            for child_label in child_labels:
                lines.append(f"- {child_label}")
            lines.append("")
        else:
            lines.append(f"- {label}")
    return lines


def clean_lines(lines):
    """Remove excessive blank lines (more than 2 consecutive)."""
    result = []
    blank_count = 0
    for line in lines:
        if line.strip() == "":
            blank_count += 1
            if blank_count <= 2:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    return result


def generate_markdown(sections):
    lines = []

    lines.append("# Madison Chinese Dance Academy - Website Content")
    lines.append("")
    lines.append("This file contains all content from the Madison Chinese Dance Academy website.")
    lines.append("It is used as context for AI-powered responses.")
    lines.append("Generated automatically by `scripts/generate-ai-context.py`.")
    lines.append("")

    seen_titles = {}
    for title, content_lines in sections:
        if title in seen_titles:
            seen_titles[title] += 1
            unique_title = f"{title} ({seen_titles[title]})"
        else:
            seen_titles[title] = 1
            unique_title = title

        lines.append("---")
        lines.append("")
        lines.append(f"## {unique_title}")
        lines.append("")

        for line in content_lines:
            lines.append(line)

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Website Navigation")
    lines.append("")

    return lines


def main():
    print("Generating ai-context.md from static HTML pages...")
    print(f"  Pages root: {ROOT}")
    print(f"  Output file: {OUTPUT_FILE}")
    print()

    homepage_path = ROOT / "index.html"
    nav_source = read_nav_js()

    sections = []

    mission, contacts = extract_footer_info(nav_source)
    if mission:
        sections.append(("About the Academy", [mission, ""]))
    if contacts:
        sections.append(("Contact", ["**Contact:**", *contacts]))

    page_paths = [homepage_path] + sorted(
        p
        for p in ROOT.rglob("index.html")
        if p != homepage_path
        and not any(part in EXCLUDED_DIRS for part in p.relative_to(ROOT).parts)
    )
    for path in page_paths:
        result = extract_page_section(path)
        if result:
            sections.append(result)

    print(f"  Found {len(sections)} content sections")
    for title, _ in sections:
        print(f"    - {title}")
    print()

    lines = generate_markdown(sections)

    lines.extend(extract_navigation(nav_source))

    lines.append("### Quick Actions")
    lines.append("- Purchase Tickets: https://www.zeffy.com/en-US/ticketing/splendid-china--2026")
    lines.append("- Donate: https://www.zeffy.com/en-US/donation-form/donate-to-madison-chinese-dance-academy")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("(c) 2026 Madison Chinese Dance Academy. All rights reserved.")

    markdown = "\n".join(clean_lines(lines))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(markdown)

    print(f"  Successfully wrote {OUTPUT_FILE}")
    print(f"  File size: {len(markdown):,} characters")
    print()
    print("Done!")


if __name__ == "__main__":
    main()
