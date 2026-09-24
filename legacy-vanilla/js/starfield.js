// starfield.js — decorative star field + nebula layer injected at the top
// of .site-main

import { $, shuffle } from './utils.js';

function createNebulaLayer(blobCount = 7) {
	const palette = shuffle([
		'rgba(77, 212, 232, 0.45)',
		'rgba(94, 184, 212, 0.42)',
		'rgba(216, 93, 75, 0.40)',
		'rgba(107, 91, 218, 0.38)',
		'rgba(90, 50, 180, 0.38)',
		'rgba(232, 184, 109, 0.30)',
		'rgba(184, 111, 212, 0.35)',
	]).slice(0, blobCount);

	const blobs = palette.map((color) => {
		const x = (Math.random() * 88 + 6).toFixed(1);
		const y = (Math.random() * 88 + 6).toFixed(1);
		const w = (Math.random() * 28 + 28).toFixed(1);
		const h = (Math.random() * 22 + 22).toFixed(1);
		const opacity = (Math.random() * 0.18 + 0.52).toFixed(2);

		return `<span class="site-nebula" style="--nebula-x:${x}%;--nebula-y:${y}%;--nebula-w:${w}%;--nebula-h:${h}%;--nebula-color:${color};--nebula-opacity:${opacity};"></span>`;
	}).join('');

	return `<div class="page-nebula-layer" aria-hidden="true">${blobs}</div>`;
}

function createStarField(className, count = 120, yMax = 100) {
	const starTints = [
		'var(--color-violet)',
		'var(--color-sunrise)',
		'#c98fd4',
		'#7eb8cc',
	];

	const stars = Array.from({ length: count }, () => {
		const size = (Math.random() * 3.5 + 2).toFixed(2);
		const opacity = (Math.random() * 0.3 + 0.65).toFixed(2);
		const x = (Math.random() * 100).toFixed(2);
		const y = (Math.random() * yMax).toFixed(2);
		const duration = (Math.random() * 2.8 + 2.2).toFixed(2);
		const delay = (Math.random() * -5).toFixed(2);
		const drift = (Math.random() * 14 - 7).toFixed(2);
		const tint = Math.random() < 0.12
			? `--star-tint:${starTints[Math.floor(Math.random() * starTints.length)]};`
			: '';

		return `<span class="site-star" style="--star-x:${x}%; --star-y:${y}%; --star-size:${size}px; --star-opacity:${opacity}; --star-duration:${duration}s; --star-delay:${delay}s; --star-drift:${drift}px; ${tint}"></span>`;
	}).join('');

	return `<div class="${className}" aria-hidden="true">${createNebulaLayer()}${stars}</div>`;
}

export function initStarfield() {
	const siteMain = $('.site-main');
	if (siteMain) {
		siteMain.insertAdjacentHTML('afterbegin', createStarField('page-star-field', 150));
	}
}
