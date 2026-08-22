// zeffy.js — lazy-loads the Zeffy donation embed script when a page
// contains an embed, with a fallback if the script fails to load

import { $, $$ } from './utils.js';

function loadZeffyEmbedScript() {
	if (!$('[data-zeffy-embed]')) return;
	if ($('script[data-zeffy-embed-script]')) return;

	const script = document.createElement('script');
	script.src = 'https://www.zeffy.com/embed/v2/zeffy-embed.js';
	script.defer = true;
	script.setAttribute('data-zeffy-embed-script', '');
	script.onerror = () => {
		$$('[data-zeffy-embed-fallback]').forEach((element) => {
			element.style.display = 'block';
		});
	};
	document.body.appendChild(script);
}

export function initZeffy() {
	loadZeffyEmbedScript();
}
