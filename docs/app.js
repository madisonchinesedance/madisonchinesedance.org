// app.js
// Runtime behavior for the static HTML pages (all content is hardcoded in
// each page's markup; this script only wires up interactivity):
// - renders the decorative star field
// - header navigation (mobile toggle, dropdowns, collapse handling)
// - announcement dismiss + scrolling text
// - gallery carousels, dots, year tabs, thumbnails, and lightbox
// - Zeffy embed lazy-loading
// - MCDA Assistant chatbot

/* Utility: select single element */
const $ = (sel) => document.querySelector(sel);
/* Utility: select all */
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function escapeHtml(value) {
	return String(value)
		.replace(/[&]/g, () => '\x26amp;')
		.replace(/[<]/g, () => '\x26lt;')
		.replace(/[>]/g, () => '\x26gt;')
		.replace(/["]/g, () => '\x26quot;')
		.replace(/[']/g, () => '\x26#39;');
}

/* Simple markdown-to-HTML for chatbot messages.
   Converts **bold**, *italic*, ## headings, --- hr, and paragraphs. */
function markdownToHtml(text) {
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

document.addEventListener('DOMContentLoaded', () => {
	const ANNOUNCEMENT_DISMISS_KEY = 'mcda-announcement-dismissed';
	const CHATBOT_MESSAGES_KEY = 'mcda-chatbot-messages';
	const navigationEntry = performance.getEntriesByType?.('navigation')?.[0];
	if (navigationEntry?.type === 'reload') {
		sessionStorage.removeItem(ANNOUNCEMENT_DISMISS_KEY);
		sessionStorage.removeItem(CHATBOT_MESSAGES_KEY);
	}

	const pageRouteId = document.body.getAttribute('data-route') || 'home';

	// ---------------------------------------------------------------
	// Announcement dismiss + scrolling text (if an announcement exists)
	// ---------------------------------------------------------------
	function enableAnnouncementScroll(announcementSection) {
		const copy = announcementSection.querySelector('.announcement-copy');
		if (!copy) return;

		const body = copy.querySelector('.announcement-body');
		if (!body) return;

		// Check if the body text overflows the available width
		const container = announcementSection.querySelector('.announcement-inner');
		if (!container) return;

		const actionsEl = announcementSection.querySelector('.announcement-actions');
		const actionsWidth = actionsEl ? actionsEl.offsetWidth + 12 : 0; // 12 = gap
		const label = copy.querySelector('.announcement-label');
		const labelWidth = label ? label.offsetWidth + 8 : 0; // 8 = gap
		const availableWidth = container.offsetWidth - actionsWidth - labelWidth - 24; // 24 = padding/gap
		const textWidth = body.scrollWidth;

		if (textWidth > availableWidth) {
			announcementSection.classList.add('has-scroll-text');

			// Create a scroll-track inside the body span with duplicated content
			const track = document.createElement('span');
			track.className = 'announcement-scroll-track';

			const item1 = document.createElement('span');
			item1.className = 'announcement-scroll-item';
			item1.textContent = body.textContent;

			const item2 = document.createElement('span');
			item2.className = 'announcement-scroll-item';
			item2.textContent = body.textContent;

			track.appendChild(item1);
			track.appendChild(item2);

			// Replace the body's text content with the scroll track
			body.innerHTML = '';
			body.appendChild(track);
		}
	}

	const announcementDismiss = $('.announcement-dismiss');
	if (announcementDismiss) {
		announcementDismiss.addEventListener('click', () => {
			sessionStorage.setItem(ANNOUNCEMENT_DISMISS_KEY, 'true');
			announcementDismiss.closest('.site-announcement')?.remove();
			$('.site-header')?.classList.remove('has-visible-announcement');
		});
	}
	const announcementSection = $('.site-announcement');
	if (announcementSection) {
		enableAnnouncementScroll(announcementSection);
	}

	// ---------------------------------------------------------------
	// Header navigation
	// ---------------------------------------------------------------
	const navToggle = $('#nav-toggle');
	const primaryNav = $('#primary-navigation');
	const dropdownToggles = $$('.nav-menu-toggle');

	function closeDropdowns(exceptToggle = null) {
		dropdownToggles.forEach((toggle) => {
			if (toggle === exceptToggle) return;
			toggle.setAttribute('aria-expanded', 'false');
			toggle.closest('.nav-item-dropdown')?.classList.remove('open');
		});
	}

	function updateNavCollapse() {
		const siteHeader = $('.site-header');
		const headerInner = $('.header-inner');
		if (!siteHeader || !headerInner) return;

		siteHeader.classList.remove('is-nav-collapsed');
		const shouldCollapse = window.matchMedia('(max-width: 1370px)').matches;
		siteHeader.classList.toggle('is-nav-collapsed', shouldCollapse);

		if (!shouldCollapse && primaryNav?.classList.contains('open')) {
			primaryNav.classList.remove('open');
			navToggle?.setAttribute('aria-expanded', 'false');
			navToggle?.setAttribute('aria-label', 'Open navigation');
			closeDropdowns();
		}
	}

	updateNavCollapse();

	let navCollapseResizeTimer;
	window.addEventListener('resize', () => {
		clearTimeout(navCollapseResizeTimer);
		navCollapseResizeTimer = setTimeout(updateNavCollapse, 100);
	});

	const headerInner = $('.header-inner');
	if (headerInner && typeof ResizeObserver !== 'undefined') {
		const navCollapseObserver = new ResizeObserver(() => updateNavCollapse());
		navCollapseObserver.observe(headerInner);
	}

	if (document.fonts?.ready) {
		document.fonts.ready.then(updateNavCollapse);
	}

	dropdownToggles.forEach((toggle) => {
		toggle.addEventListener('click', () => {
			const expanded = toggle.getAttribute('aria-expanded') === 'true';
			closeDropdowns(toggle);
			toggle.setAttribute('aria-expanded', String(!expanded));
			toggle.closest('.nav-item-dropdown')?.classList.toggle('open', !expanded);
		});
	});

	document.addEventListener('click', (e) => {
		if (!e.target.closest('.nav-item-dropdown')) closeDropdowns();
	});

	// NAVIGATION: toggle mobile menu
	if (navToggle && primaryNav) {
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			navToggle.setAttribute('aria-expanded', String(!expanded));
			primaryNav.classList.toggle('open');

			// Update accessible label for toggle
			navToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
		});

		// Close mobile nav when any nav link is clicked (improves UX on small screens)
		$$('.nav-link').forEach(link => {
			link.addEventListener('click', () => {
				if (link.classList.contains('nav-menu-toggle')) return;

				if (primaryNav.classList.contains('open')) {
					primaryNav.classList.remove('open');
					navToggle.setAttribute('aria-expanded', 'false');
					navToggle.setAttribute('aria-label', 'Open navigation');
				}
				closeDropdowns();
			});
		});

		// Close the menu with Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') closeDropdowns();

			if (e.key === 'Escape' && primaryNav.classList.contains('open')) {
				primaryNav.classList.remove('open');
				navToggle.setAttribute('aria-expanded', 'false');
				navToggle.setAttribute('aria-label', 'Open navigation');
				navToggle.focus();
			}
		});
	}

	// ---------------------------------------------------------------
	// Decorative star field
	// ---------------------------------------------------------------
	function shuffle(items) {
		const list = items.slice();
		for (let i = list.length - 1; i > 0; i -= 1) {
			const j = Math.floor(Math.random() * (i + 1));
			[list[i], list[j]] = [list[j], list[i]];
		}
		return list;
	}

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

	const siteMain = $('.site-main');
	if (siteMain) {
		siteMain.insertAdjacentHTML('afterbegin', createStarField('page-star-field', 150));
	}

	// ---------------------------------------------------------------
	// Zeffy embed lazy-loading
	// ---------------------------------------------------------------
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

	loadZeffyEmbedScript();

	// ---------------------------------------------------------------
	// Galleries: carousels wired to hardcoded markup + lightbox
	// ---------------------------------------------------------------
	const lightbox = $('[data-gallery-lightbox]');
	const lightboxImage = $('[data-gallery-lightbox-image]');
	const lightboxClose = $('.gallery-lightbox-close');
	let activeGalleryRunner = null;

	function openLightbox(images, index) {
		const image = images[index];
		if (!lightbox || !lightboxImage || !image) return;

		activeGalleryRunner?.stopAutoScroll();
		lightboxImage.src = image.currentSrc || image.src;
		lightboxImage.alt = image.alt;
		lightbox.hidden = false;
		lightboxClose?.focus();
	}

	function initCarousel(scope) {
		// scope: element containing one .gallery-container plus optional
		// [data-gallery-dots] and [data-gallery-featured-thumbs] hosts
		const container = scope.querySelector('.gallery-container');
		const wrapper = container?.querySelector('.gallery-wrapper');
		if (!container || !wrapper) return null;

		const images = Array.from(wrapper.querySelectorAll('img'));
		if (!images.length) return null;

		const dotsHost = scope.querySelector('[data-gallery-dots]');
		const thumbsHost = scope.querySelector('[data-gallery-featured-thumbs]');
		const prevButton = container.querySelector('.prev');
		const nextButton = container.querySelector('.next');
		let currentIndex = 0;
		let autoScrollInterval;

		images.forEach((image, index) => {
			image.setAttribute('tabindex', '-1');
			image.setAttribute('data-gallery-index', String(index));
			image.style.cursor = 'pointer';
			image.addEventListener('click', () => {
				stopAutoScroll();
				currentIndex = index;
				openLightbox(images, index);
			});
		});

		function updateSelectionIndicators() {
			if (dotsHost) {
				dotsHost.querySelectorAll('.gallery-dot').forEach((dot) => {
					const dotIndex = Number(dot.getAttribute('data-gallery-dot'));
					dot.classList.toggle('active', dotIndex === currentIndex);
				});
			}
			if (thumbsHost) {
				thumbsHost.querySelectorAll('.gallery-thumb').forEach((thumb) => {
					const thumbIndex = Number(thumb.getAttribute('data-gallery-thumb'));
					thumb.classList.toggle('active', thumbIndex === currentIndex);
				});
			}
		}

		function updateGallery({ focus = false, scroll = true, behavior = 'smooth' } = {}) {
			const image = images[currentIndex];
			if (!image) return;

			if (scroll) {
				wrapper.scrollTo({
					left: currentIndex * wrapper.clientWidth,
					behavior,
				});
			}
			if (focus) image.focus({ preventScroll: true });

			updateSelectionIndicators();
		}

		function startAutoScroll() {
			if (autoScrollInterval || images.length < 2) return;

			autoScrollInterval = setInterval(() => {
				currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
				updateGallery({ scroll: true });
			}, 5000);
		}

		function stopAutoScroll() {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}

		const runner = { startAutoScroll, stopAutoScroll };

		if (prevButton && nextButton) {
			prevButton.addEventListener('click', () => {
				stopAutoScroll();
				currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
				updateGallery({ focus: true });
				startAutoScroll();
			});

			nextButton.addEventListener('click', () => {
				stopAutoScroll();
				currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
				updateGallery({ focus: true });
				startAutoScroll();
			});
		}

		wrapper.addEventListener('scroll', () => {
			const wrapperLeft = wrapper.getBoundingClientRect().left;
			const closestImage = images.reduce((closest, image, index) => {
				const distance = Math.abs(image.getBoundingClientRect().left - wrapperLeft);
				return distance < closest.distance ? { distance, index } : closest;
			}, { distance: Infinity, index: currentIndex });

			currentIndex = closestImage.index;
			updateSelectionIndicators();
		}, { passive: true });

		if (dotsHost) {
			dotsHost.addEventListener('click', (event) => {
				const button = event.target.closest('[data-gallery-dot]');
				if (!button) return;
				const index = Number(button.getAttribute('data-gallery-dot'));
				if (Number.isNaN(index)) return;

				stopAutoScroll();
				currentIndex = index;
				updateGallery({ focus: true });
				startAutoScroll();
			});
		}

		if (thumbsHost) {
			thumbsHost.addEventListener('click', (event) => {
				const button = event.target.closest('[data-gallery-thumb]');
				if (!button) return;
				const index = Number(button.getAttribute('data-gallery-thumb'));
				if (Number.isNaN(index)) return;

				stopAutoScroll();
				currentIndex = index;
				updateGallery({ focus: true });
				openLightbox(images, index);
			});
		}

		// archive thumbnail grids open the lightbox directly
		const gridHost = scope.querySelector('[data-gallery-grid]');
		if (gridHost) {
			gridHost.addEventListener('click', (event) => {
				const button = event.target.closest('[data-gallery-thumb]');
				if (!button) return;
				const index = Number(button.getAttribute('data-gallery-thumb'));
				if (Number.isNaN(index)) return;

				stopAutoScroll();
				currentIndex = index;
				updateGallery({ scroll: false });
				openLightbox(images, index);
			});
		}

		container.addEventListener('mouseenter', stopAutoScroll);
		container.addEventListener('mouseleave', startAutoScroll);

		startAutoScroll();
		return runner;
	}

	// Archive galleries: year tabs switch between hardcoded per-year panels
	function initArchiveGalleries() {
		const tabsHost = $('.gallery-year-tabs');
		if (!tabsHost) return;

		const panels = $$('[data-gallery-year-panel]');
		const tabs = Array.from(tabsHost.querySelectorAll('[data-gallery-year-tab]'));
		if (!panels.length || !tabs.length) return;

		const runners = new Map();
		const initial = tabs.findIndex((tab) => tab.classList.contains('active'));
		const activeIndex = initial >= 0 ? initial : 0;

		function activate(index) {
			panels.forEach((panel, panelIndex) => {
				panel.hidden = panelIndex !== index;
			});
			tabs.forEach((tab, tabIndex) => {
				const isActive = tabIndex === index;
				tab.classList.toggle('active', isActive);
				tab.setAttribute('aria-selected', String(isActive));
				tab.setAttribute('tabindex', isActive ? '0' : '-1');
			});

			runners.get(activeGalleryPanel)?.stopAutoScroll();
			activeGalleryPanel = index;

			if (!runners.has(index)) {
				runners.set(index, initCarousel(panels[index]));
			}
			runners.get(index)?.startAutoScroll();
		}

		let activeGalleryPanel = activeIndex;

		tabsHost.addEventListener('click', (event) => {
			const tab = event.target.closest('[data-gallery-year-tab]');
			if (!tab) return;
			const index = Number(tab.getAttribute('data-gallery-year-tab'));
			if (Number.isNaN(index) || index === activeGalleryPanel) return;
			activate(index);
		});

		activate(activeIndex);
	}

	// Standalone galleries (runners, featured) — archive panels are handled
	// by initArchiveGalleries so their carousels start lazily per year
	document.querySelectorAll('.gallery-container').forEach((galleryContainer) => {
		if (galleryContainer.closest('[data-gallery-year-panel]')) return;
		if (galleryContainer.dataset.galleryInitialized === 'true') return;

		const scope =
			galleryContainer.closest('.gallery-section')
			|| galleryContainer.parentElement;
		const runner = initCarousel(scope);
		if (runner) {
			galleryContainer.dataset.galleryInitialized = 'true';
		}
	});

	initArchiveGalleries();

	if (lightbox) {
		lightboxClose?.addEventListener('click', () => {
			if (!lightboxImage) return;
			lightbox.hidden = true;
			lightboxImage.removeAttribute('src');
			activeGalleryRunner?.startAutoScroll();
			activeGalleryRunner = null;
		});
		lightbox.addEventListener('click', (event) => {
			if (event.target !== lightbox) return;
			lightbox.hidden = true;
			lightboxImage?.removeAttribute('src');
			activeGalleryRunner?.startAutoScroll();
			activeGalleryRunner = null;
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !lightbox.hidden) {
				lightbox.hidden = true;
				lightboxImage?.removeAttribute('src');
				activeGalleryRunner?.startAutoScroll();
				activeGalleryRunner = null;
			}
		});
	}

	// ---------------------------------------------------------------
	// MCDA Assistant chatbot
	// ---------------------------------------------------------------
	function renderChatbot() {
		document.body.insertAdjacentHTML('beforeend', `
			<div class="chatbot" id="chatbot" role="region" aria-label="Chat assistant">
				<button class="chatbot-toggle" id="chatbot-toggle" type="button" aria-expanded="false" aria-controls="chatbot-panel" aria-label="Open chat assistant">
					<svg class="chatbot-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					<svg class="chatbot-icon-close" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
					<span class="chatbot-toggle-label">MCDA ASSISTANT</span>
				</button>

				<div class="chatbot-panel" id="chatbot-panel" role="dialog" aria-modal="true" aria-label="Chat assistant" hidden>
					<div class="chatbot-header">
						<div class="chatbot-header-info">
							<div class="chatbot-avatar" aria-hidden="true">
								<span class="chatbot-logo">MCDA</span>
							</div>
							<div>
								<h3 class="chatbot-title">MCDA ASSISTANT</h3>
								<span class="chatbot-status">BETA</span>
							</div>
						</div>
						<div class="chatbot-header-actions">
							<button class="chatbot-clear" id="chatbot-clear" type="button" aria-label="Clear chat">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
								</svg>
							</button>
							<button class="chatbot-minimize" id="chatbot-minimize" type="button" aria-label="Minimize chat">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							</button>
						</div>
					</div>

					<div class="chatbot-messages" id="chatbot-messages" role="log" aria-live="polite" aria-label="Conversation">
						<div class="chatbot-message bot">
							<div class="chatbot-message-avatar" aria-hidden="true">
								<span class="chatbot-logo">MCDA</span>
							</div>
							<div class="chatbot-message-content">
								<p>Hello! I'm the MCDA Assistant. How can I help you today?</p>
							</div>
						</div>
						<div class="chatbot-message bot chatbot-notice">
							<div class="chatbot-message-avatar" aria-hidden="true">
								<span class="chatbot-logo">MCDA</span>
							</div>
							<div class="chatbot-message-content">
								<p><strong>Note:</strong> This chatbot is in testing stage and may not work properly. For urgent inquiries, please contact the academy directly.</p>
							</div>
						</div>
					</div>

					<div class="chatbot-suggestions" id="chatbot-suggestions"></div>
					<div class="chatbot-input-area">
						<form class="chatbot-form" id="chatbot-form">
							<input
								type="text"
								class="chatbot-input"
								id="chatbot-input"
								placeholder="Type your message..."
								autocomplete="off"
								aria-label="Chat message"
								required
							>
							<button type="submit" class="chatbot-send" id="chatbot-send" aria-label="Send message">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="22" y1="2" x2="11" y2="13"></line>
									<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
								</svg>
							</button>
						</form>
						<p class="chatbot-disclaimer">AI assistant. Responses may not be accurate.</p>
					</div>
				</div>
			</div>
		`);
	}

	renderChatbot();

	const chatbot = $('#chatbot');
	const chatbotToggle = $('#chatbot-toggle');
	const chatbotPanel = $('#chatbot-panel');
	const chatbotMinimize = $('#chatbot-minimize');
	const chatbotForm = $('#chatbot-form');
	const chatbotInput = $('#chatbot-input');
	const chatbotMessages = $('#chatbot-messages');
	const chatbotSend = $('#chatbot-send');
	const chatbotClear = $('#chatbot-clear');
	const chatbotSuggestions = $('#chatbot-suggestions');

	// Page-specific suggested prompts
	const SUGGESTED_PROMPTS = {
		home: [
			'What programs do you offer?',
			'How can I get involved?',
			'When is the next performance?'
		],
		about: [
			'What is the mission of MCDA?',
			'Who leads the academy?',
			'How can I contact MCDA?'
		],
		'beginner-dancers': [
			'When do classes start?',
			'How do I register for classes?',
			'What should I wear to class?'
		],
		'intermediate-dancers': [
			'What level is intermediate?',
			'How do I prepare for intermediate classes?',
			'Can I move up to advanced?'
		],
		'advanced-dancers': [
			'What does the advanced program involve?',
			'Are there performance opportunities?',
			'How do I audition?'
		],
		'dance-with-us': [
			'What classes are available for adults?',
			'Do I need experience to join?',
			'What is the class schedule?'
		],
		'book-a-performance': [
			'How do I book a performance?',
			'What types of performances do you offer?',
			'What is the pricing for a booking?'
		],
		'see-a-performance': [
			'When is the next show?',
			'Where are performances held?',
			'How do I buy tickets?'
		],
		'support-our-cause': [
			'How can I donate?',
			'Are donations tax-deductible?',
			'What does my donation support?'
		],
		donate: [
			'How do I make a donation?',
			'What payment methods are accepted?',
			'Can I set up recurring donations?'
		],
		tickets: [
			'How do I purchase tickets?',
			'Are there group discounts?',
			'What is the refund policy?'
		],
		events: [
			'What upcoming events are planned?',
			'How do I RSVP for an event?',
			'Can I volunteer at events?'
		],
		services: [
			'What community services do you provide?',
			'How can I request a cultural workshop?',
			'Do you offer virtual programs?'
		],
		faq: [
			'What is the class schedule?',
			'What is your refund policy?',
			'Do you offer private lessons?'
		],
		gallery: [
			'How can I appear in the gallery?',
			'Can I submit my photos?',
			'How do I view past performances?'
		]
	};

	if (chatbot && chatbotToggle && chatbotPanel) {
		// Render page-specific suggestion bubbles
		function renderSuggestions() {
			if (!chatbotSuggestions) return;
			const prompts = SUGGESTED_PROMPTS[pageRouteId] || SUGGESTED_PROMPTS.home;
			chatbotSuggestions.innerHTML = prompts.map((prompt) =>
				`<button type="button" class="chatbot-suggestion-btn">${escapeHtml(prompt)}</button>`
			).join('');
		}

		// Handle suggestion clicks
		function setupSuggestionClicks() {
			if (!chatbotSuggestions) return;
			chatbotSuggestions.addEventListener('click', (e) => {
				const btn = e.target.closest('.chatbot-suggestion-btn');
				if (!btn) return;
				e.stopPropagation();
				const text = btn.textContent;
				chatbotSuggestions.innerHTML = '';
				sendMessage(text);
			});
		}

		// Load saved chat messages from sessionStorage
		function loadSavedMessages() {
			try {
				const saved = sessionStorage.getItem(CHATBOT_MESSAGES_KEY);
				if (!saved) return false;
				const messages = JSON.parse(saved);
				if (!Array.isArray(messages) || messages.length === 0) return false;

				// Clear the default welcome messages
				chatbotMessages.innerHTML = '';

				// Re-render each saved message
				messages.forEach(({ text, isUser }) => {
					const messageDiv = document.createElement('div');
					messageDiv.className = `chatbot-message ${isUser ? 'user' : 'bot'}`;

					const avatarDiv = document.createElement('div');
					avatarDiv.className = 'chatbot-message-avatar';
					avatarDiv.setAttribute('aria-hidden', 'true');
					avatarDiv.innerHTML = isUser
						? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
						: '<span class="chatbot-logo">MCDA</span>';

					const contentDiv = document.createElement('div');
					contentDiv.className = 'chatbot-message-content';
					if (isUser) {
						const p = document.createElement('p');
						p.textContent = text;
						contentDiv.appendChild(p);
					} else {
						contentDiv.dataset.rawText = text;
						contentDiv.innerHTML = markdownToHtml(text);
					}

					messageDiv.appendChild(avatarDiv);
					messageDiv.appendChild(contentDiv);
					chatbotMessages.appendChild(messageDiv);
				});

				chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
				return true;
			} catch (e) {
				return false;
			}
		}

		// Save chat messages to sessionStorage
		function saveMessages() {
			try {
				const messages = [];
				chatbotMessages.querySelectorAll('.chatbot-message').forEach((msg) => {
					const contentEl = msg.querySelector('.chatbot-message-content');
					if (contentEl) {
						const text = msg.classList.contains('user')
							? (contentEl.querySelector('p')?.textContent || '')
							: (contentEl.dataset.rawText || '');
						messages.push({ text, isUser: msg.classList.contains('user') });
					}
				});
				sessionStorage.setItem(CHATBOT_MESSAGES_KEY, JSON.stringify(messages));
			} catch (e) {
				// Silently fail if sessionStorage is unavailable
			}
		}

		// Render suggestions only if no saved messages exist
		if (!loadSavedMessages()) {
			renderSuggestions();
			setupSuggestionClicks();
		}

		// Clear chat button
		if (chatbotClear) {
			chatbotClear.addEventListener('click', () => {
				chatbotMessages.innerHTML = '';
				const welcomeMsg = document.createElement('div');
				welcomeMsg.className = 'chatbot-message bot';
				welcomeMsg.innerHTML = `
					<div class="chatbot-message-avatar" aria-hidden="true"><span class="chatbot-logo">MCDA</span></div>
					<div class="chatbot-message-content"><p>Chat cleared. How can I help you?</p></div>
				`;
				chatbotMessages.appendChild(welcomeMsg);
				chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
				sessionStorage.removeItem(CHATBOT_MESSAGES_KEY);
			});
		}

		function toggleChatbot() {
			const isOpen = chatbotToggle.getAttribute('aria-expanded') === 'true';
			chatbotToggle.setAttribute('aria-expanded', String(!isOpen));
			chatbotPanel.hidden = isOpen;
			if (!isOpen) {
				chatbotInput.focus();
			}
		}

		chatbotToggle.addEventListener('click', toggleChatbot);

		if (chatbotMinimize) {
			chatbotMinimize.addEventListener('click', toggleChatbot);
		}

		// Close chatbot on Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && chatbotToggle.getAttribute('aria-expanded') === 'true') {
				toggleChatbot();
				chatbotToggle.focus();
			}
		});

		// Close chatbot when clicking outside
		document.addEventListener('click', (e) => {
			if (chatbotToggle.getAttribute('aria-expanded') === 'true' &&
				!chatbot.contains(e.target)) {
				toggleChatbot();
			}
		});

		function addMessage(text, isUser = false) {
			const messageDiv = document.createElement('div');
			messageDiv.className = `chatbot-message ${isUser ? 'user' : 'bot'}`;

			const avatarDiv = document.createElement('div');
			avatarDiv.className = 'chatbot-message-avatar';
			avatarDiv.setAttribute('aria-hidden', 'true');
			avatarDiv.innerHTML = isUser
				? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
				: '<span class="chatbot-logo">MCDA</span>';

			const contentDiv = document.createElement('div');
			contentDiv.className = 'chatbot-message-content';
			if (isUser) {
				const p = document.createElement('p');
				p.textContent = text;
				contentDiv.appendChild(p);
			} else {
				contentDiv.dataset.rawText = text;
				contentDiv.innerHTML = markdownToHtml(text);
			}

			messageDiv.appendChild(avatarDiv);
			messageDiv.appendChild(contentDiv);

			chatbotMessages.appendChild(messageDiv);
			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
			saveMessages();
		}

		function showTypingIndicator() {
			const typingDiv = document.createElement('div');
			typingDiv.className = 'chatbot-message bot chatbot-typing';
			typingDiv.innerHTML = `
				<div class="chatbot-message-avatar" aria-hidden="true">
					<span class="chatbot-logo">MCDA</span>
				</div>
				<div class="chatbot-message-content">
					<div class="chatbot-typing-dots">
						<span></span><span></span><span></span>
					</div>
				</div>
			`;
			chatbotMessages.appendChild(typingDiv);
			chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
			return typingDiv;
		}

		function removeTypingIndicator(typingDiv) {
			typingDiv.remove();
		}

		// Cloudflare Worker endpoint
		const CHATBOT_API_ENDPOINT = 'https://assistant.madisonchinesedance.org';

		async function sendMessage(message) {
			// Add user message
			addMessage(message, true);
			chatbotInput.value = '';
			chatbotSend.disabled = true;

			// Show typing indicator
			const typingIndicator = showTypingIndicator();

			try {
				const response = await fetch(CHATBOT_API_ENDPOINT, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ message })
				});

				if (!response.ok) {
					let errorDetail = '';
					try {
						const errBody = await response.json();
						errorDetail = errBody.error || errBody.message || JSON.stringify(errBody);
					} catch {
						errorDetail = await response.text().catch(() => '');
					}
					throw new Error(`HTTP ${response.status}: ${errorDetail}`);
				}

				const data = await response.json();
				const botResponse = data.response || 'Sorry, I could not process your request.';

				removeTypingIndicator(typingIndicator);
				addMessage(botResponse, false);
			} catch (error) {
				removeTypingIndicator(typingIndicator);
				addMessage(`Error: ${error.message}`, false);
				console.error('Chatbot error:', error);
			} finally {
				chatbotSend.disabled = false;
				chatbotInput.focus();
			}
		}

		if (chatbotForm) {
			chatbotForm.addEventListener('submit', (e) => {
				e.preventDefault();
				const message = chatbotInput.value.trim();
				if (message) {
					sendMessage(message);
				}
			});
		}
	}
});

/* -------------------------------------------------
   CSS for typing indicator (injected via JS to keep
   all chatbot styles together)
   ------------------------------------------------- */
const chatbotStyles = `
<style>
.chatbot-typing .chatbot-message-content {
	background: linear-gradient(180deg, var(--color-violet), var(--color-deep-navy));
	border: 1px solid var(--edge-contrast);
	border-radius: 16px;
	border-bottom-left-radius: 4px;
	padding: 12px 16px;
}
.chatbot-typing-dots {
	display: flex;
	gap: 4px;
}
.chatbot-typing-dots span {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--light-text-color);
	opacity: 0.5;
	animation: chatbot-typing-bounce 1.4s ease-in-out infinite both;
}
.chatbot-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.chatbot-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes chatbot-typing-bounce {
	0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
	40% { transform: scale(1); opacity: 1; }
}
</style>
`;
document.head.insertAdjacentHTML('beforeend', chatbotStyles);
