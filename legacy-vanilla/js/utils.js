// utils.js — small shared helpers used across modules

/* Select a single element */
export const $ = (sel) => document.querySelector(sel);

/* Select all matching elements as an array */
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export function escapeHtml(value) {
	return String(value)
		.replace(/[&]/g, () => '\x26amp;')
		.replace(/[<]/g, () => '\x26lt;')
		.replace(/[>]/g, () => '\x26gt;')
		.replace(/["]/g, () => '\x26quot;')
		.replace(/[']/g, () => '\x26#39;');
}

/* Minimal markdown-to-HTML for chatbot messages.
   Converts **bold**, *italic*, #/##/### headings, --- hr, and paragraphs. */
export function markdownToHtml(text) {
	const esc = String(text)
		.replace(/[&]/g, () => '\x26amp;')
		.replace(/[<]/g, () => '\x26lt;')
		.replace(/[>]/g, () => '\x26gt;')
		.replace(/["]/g, () => '\x26quot;');
	const md = esc
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>');
	// Split on blank lines for paragraph/block-level yield
	return md.split(/\n{2,}/).map(b => {
		const block = b.trim();
		if (!block) return '';
		if (/^#/.test(block)) {
			const inline = block.replace(/\n/g, ' ');
			if (/^### /.test(inline)) return '<h3>' + inline.slice(4) + '</h3>';
			if (/^## /.test(inline)) return '<h2>' + inline.slice(3) + '</h2>';
			if (/^# /.test(inline)) return '<h1>' + inline.slice(2) + '</h1>';
		}
		if (/^---+$/.test(block)) return '<hr>';
		// Paragraph: replace remaining newlines with spaces
		return '<p>' + block.replace(/\n/g, ' ') + '</p>';
	}).filter(Boolean).join('');
}

export function shuffle(items) {
	const list = items.slice();
	for (let i = list.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[list[i], list[j]] = [list[j], list[i]];
	}
	return list;
}
