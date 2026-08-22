// navigation.js
// Combines two jobs that share the same markup:
// 1. Injects the shared site header and footer into every page. Each page
//    contains <div data-site-header></div> and <div data-site-footer></div>
//    placeholders; initNavigation() fills them in and marks the current
//    page's navigation link as active.
// 2. Wires header interactivity: mobile menu toggle, dropdown menus, and
//    the nav collapse at narrow viewport widths.
//
// To change menu labels, add a page, or edit the footer, update the data below.

import { $, $$, escapeHtml } from './utils.js';

// ---------------------------------------------------------------------------
// Navigation data (hrefs are site-root-relative folder URLs)
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
	{ label: 'Home', href: '/' },
	{ label: 'Gallery', href: '/gallery/' },
	{ label: 'Programs', href: '/programs/' },
	{
		label: 'Classes',
		items: [
			{ label: 'Beginner Dancers', href: '/classes/beginner-dancers/' },
			{ label: 'Intermediate Dancers', href: '/classes/intermediate-dancers/' },
			{ label: 'Advanced Dancers', href: '/classes/advanced-dancers/' },
		],
	},
	{
		label: 'Events',
		items: [
			{ label: 'Events', href: '/events/' },
			{ label: 'Services', href: '/services/' },
		],
	},
	{
		label: 'Get Involved',
		items: [
			{ label: 'Dance with Us', href: '/get-involved/dance-with-us/' },
			{ label: 'Book a Performance', href: '/get-involved/book-a-performance/' },
			{ label: 'See A Performance', href: '/get-involved/see-a-performance/' },
			{ label: 'Support Our Cause', href: '/get-involved/support-our-cause/' },
		],
	},
	{
		label: 'Splendid China',
		items: [
			{ label: 'Splendid China 2026', href: '/splendid-china/2026/' },
			{ label: 'Splendid China 2025', href: '/splendid-china/2025/' },
			{ label: 'Splendid China 2024', href: '/splendid-china/2024/' },
			{ label: 'Splendid China 2023', href: '/splendid-china/2023/' },
			{ label: 'Splendid China 2022', href: '/splendid-china/2022/' },
			{ label: 'Splendid China 2019', href: '/splendid-china/2019/' },
			{ label: 'Splendid China 2018', href: '/splendid-china/2018/' },
			{ label: 'Splendid China 2017', href: '/splendid-china/2017/' },
			{ label: 'Splendid China 2016', href: '/splendid-china/2016/' },
			{ label: 'Splendid China 2015', href: '/splendid-china/2015/' },
			{ label: 'Splendid China 2014', href: '/splendid-china/2014/' },
			{ label: 'Splendid China 2013', href: '/splendid-china/2013/' },
			{ label: 'Splendid China 2012', href: '/splendid-china/2012/' },
			{ label: 'Splendid China 2011', href: '/splendid-china/2011/' },
			{ label: 'Splendid China 2010', href: '/splendid-china/2010/' },
			{ label: 'Splendid China 2009', href: '/splendid-china/2009/' },
			{ label: 'Splendid China 2008', href: '/splendid-china/2008/' },
		],
	},
];

const NAV_ACTIONS = [
	{ label: 'Purchase Tickets', href: '/tickets/', ariaLabel: 'Purchase Tickets' },
	{ label: 'Donate', href: '/donate/', ariaLabel: 'Donate' }
];

const FOOTER = {
	brandText: 'Madison Chinese Dance Academy',
	mission: 'Madison Chinese Dance Academy teaches Chinese dance and ballet while cultivating appreciation for Eastern and Western arts. We welcome students and families into performances, classes, and community programs that celebrate culture through movement.',
	homeHref: '/',
	columns: [
		{
			heading: 'Explore',
			links: [
				{ label: 'Home', href: '/' },
				{ label: 'Gallery', href: '/gallery/' },
				{ label: 'Programs', href: '/programs/' },
				{ label: 'Purchase Tickets', href: '/tickets/' },
				{ label: 'Donate', href: '/donate/' }
			]
		},
		{
			heading: 'Classes',
			links: [
				{ label: 'Advanced Dancers', href: '/classes/advanced-dancers/' },
				{ label: 'Beginner Dancers', href: '/classes/beginner-dancers/' },
				{ label: 'Intermediate Dancers', href: '/classes/intermediate-dancers/' }
			]
		},
		{
			heading: 'Events',
			links: [
				{ label: 'Events', href: '/events/' },
				{ label: 'Services', href: '/services/' }
			]
		},
		{
			heading: 'Get Involved',
			links: [
				{ label: 'Book a Performance', href: '/get-involved/book-a-performance/' },
				{ label: 'Dance with Us', href: '/get-involved/dance-with-us/' },
				{ label: 'See A Performance', href: '/get-involved/see-a-performance/' },
				{ label: 'Support Our Cause', href: '/get-involved/support-our-cause/' }
			]
		},
		{
			heading: 'Splendid China',
			links: [
				{ label: 'Splendid China 2026', href: '/splendid-china/2026/' },
				{ label: 'Splendid China 2025', href: '/splendid-china/2025/' },
				{ label: 'Splendid China 2024', href: '/splendid-china/2024/' },
				{ label: 'Splendid China 2023', href: '/splendid-china/2023/' },
				{ label: 'Splendid China 2022', href: '/splendid-china/2022/' },
				{ label: 'Splendid China 2019', href: '/splendid-china/2019/' }
			]
		}
	],
	operations: [
		{ label: 'contact@madisonchinesedance.org', href: 'mailto:contact@madisonchinesedance.org' },
		{ label: '(301)-299-1562', href: 'tel:13012991562' },
		{ label: 'PO Box 10067 Rockville, MD 20849' }
	],
	copyright: '© 2026 Madison Chinese Dance Academy. All rights reserved.'
};

// ---------------------------------------------------------------------------
// Active-page detection
// ---------------------------------------------------------------------------

function normalizePath(path) {
	let normalized = String(path || '/').split('#')[0].split('?')[0];
	normalized = normalized.replace(/\/index\.html$/, '/');
	if (!normalized.endsWith('/')) {
		normalized += '/';
	}
	return normalized;
}

function isActive(href) {
	return normalizePath(href) === normalizePath(window.location.pathname);
}

// ---------------------------------------------------------------------------
// Header rendering
// ---------------------------------------------------------------------------

const CARET_SVG = `
	<svg class="nav-caret" width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
		<path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
	</svg>`;

const LOGO_SVG_HEADER = `
	<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
		<circle cx="16" cy="16" r="14.5" stroke="currentColor" stroke-width="1.5"/>
		<text x="16" y="14" text-anchor="middle" fill="currentColor" font-size="9" font-weight="800" font-family="inherit" letter-spacing="0.5">MC</text>
		<text x="16" y="24" text-anchor="middle" fill="currentColor" font-size="9" font-weight="800" font-family="inherit" letter-spacing="0.5">DA</text>
	</svg>`;

const LOGO_SVG_FOOTER = `
	<svg width="40" height="40" viewBox="0 0 32 32" fill="none">
		<circle cx="16" cy="16" r="14.5" stroke="currentColor" stroke-width="1.5"/>
		<text x="16" y="14" text-anchor="middle" fill="currentColor" font-size="9" font-weight="800" font-family="inherit" letter-spacing="0.5">MC</text>
		<text x="16" y="24" text-anchor="middle" fill="currentColor" font-size="9" font-weight="800" font-family="inherit" letter-spacing="0.5">DA</text>
	</svg>`;

function navLink(item) {
	const active = isActive(item.href);
	const activeClass = active ? ' active' : '';
	const currentAttr = active ? ' aria-current="page"' : '';
	return `<li class="nav-item"><a href="${escapeHtml(item.href)}" class="nav-link${activeClass}"${currentAttr}>${escapeHtml(item.label)}</a></li>`;
}

function navMenu(item, index) {
	if (!item.items) {
		return navLink(item);
	}

	const active = item.items.some((child) => isActive(child.href));
	const activeClass = active ? ' active' : '';
	const menuId = `nav-menu-${index}`;
	return `
		<li class="nav-item nav-item-dropdown">
			<button class="nav-link nav-menu-toggle${activeClass}" type="button" aria-expanded="false" aria-controls="${menuId}">
				${escapeHtml(item.label)}
				${CARET_SVG}
			</button>
			<ul id="${menuId}" class="nav-dropdown" aria-label="${escapeHtml(item.label)} submenu">
				${item.items.map(navLink).join('')}
			</ul>
		</li>
	`;
}

function headerAction(action) {
	const active = isActive(action.href);
	const currentAttr = active ? ' aria-current="page"' : '';
	return `<a href="${escapeHtml(action.href)}" class="btn btn-primary header-cta" role="button" aria-label="${escapeHtml(action.ariaLabel || action.label)}"${currentAttr}>${escapeHtml(action.label)}</a>`;
}

function buildHeader() {
	const actionButtons = NAV_ACTIONS.map(headerAction).join('');
	const navItems = NAV_ITEMS.map(navMenu).join('');
	return `
		<header class="site-header" role="banner">
			<div class="container header-inner">
				<div class="header-left">
					<a href="/" class="logo" aria-label="Madison Chinese Dance Academy home">
						<span class="logo-icon" aria-hidden="true">
							${LOGO_SVG_HEADER}
						</span>
						<span class="logo-full-text">Madison Chinese Dance Academy</span>
						<span class="logo-short-text">MCDA</span>
					</a>
				</div>

				<nav id="primary-navigation" class="primary-nav" aria-label="Primary navigation">
					<ul class="nav-list">
						${navItems}
						<li class="nav-cta-list">
							${actionButtons}
						</li>
					</ul>
				</nav>

				<div class="header-controls">
					<button id="nav-toggle" class="nav-toggle" aria-controls="primary-navigation" aria-expanded="false" aria-label="Open navigation">
						<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<rect width="24" height="2" y="3" rx="1"></rect>
							<rect width="24" height="2" y="11" rx="1"></rect>
							<rect width="24" height="2" y="19" rx="1"></rect>
						</svg>
					</button>
				</div>

				<div class="header-ctas">
					${actionButtons}
				</div>
			</div>
		</header>
	`;
}

// ---------------------------------------------------------------------------
// Footer rendering
// ---------------------------------------------------------------------------

function buildFooter() {
	const columns = FOOTER.columns.map((column) => {
		const items = column.links.map((link) => {
			if (!link.href) {
				return `<li><span>${escapeHtml(link.label)}</span></li>`;
			}
			return `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`;
		}).join('');
		return `
			<section class="footer-column" aria-label="${escapeHtml(column.heading)}">
				<h2>${escapeHtml(column.heading)}</h2>
				<ul>${items}</ul>
			</section>`;
	}).join('');

	const operations = FOOTER.operations.map((op) => {
		if (!op.href) {
			return `<span>${escapeHtml(op.label)}</span>`;
		}
		return `<a href="${escapeHtml(op.href)}">${escapeHtml(op.label)}</a>`;
	}).join('<br>');

	return `
		<footer class="site-footer" role="contentinfo">
			<div class="container footer-inner">
				<section class="footer-brand" aria-label="${escapeHtml(FOOTER.brandText)}">
					<a href="${escapeHtml(FOOTER.homeHref)}" class="footer-logo" aria-label="${escapeHtml(FOOTER.brandText)} home">
						<span class="footer-logo-icon" aria-hidden="true">
							${LOGO_SVG_FOOTER}
						</span>
					</a>
					<p class="footer-brand-name">${escapeHtml(FOOTER.brandText)}</p>
					<p class="footer-mission">${escapeHtml(FOOTER.mission)}</p>
					<div class="footer-operations">${operations}</div>
				</section>

				<nav class="footer-directory" aria-label="Footer navigation">
					${columns}
				</nav>
			</div>
			<div class="container footer-bottom">
				<p class="footer-copy">${escapeHtml(FOOTER.copyright)}</p>
			</div>
		</footer>
	`;
}

// ---------------------------------------------------------------------------
// Init: inject header/footer, then wire up interactivity. Must run before
// the other modules so they can query the injected markup.
// ---------------------------------------------------------------------------

export function initNavigation() {
	const headerMount = document.querySelector('[data-site-header]');
	if (headerMount) {
		headerMount.outerHTML = buildHeader();
	}

	const footerMount = document.querySelector('[data-site-footer]');
	if (footerMount) {
		footerMount.outerHTML = buildFooter();
	}

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

	// Toggle mobile menu
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
}
