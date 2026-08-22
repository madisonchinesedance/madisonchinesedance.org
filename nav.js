// nav.js
// Injects the shared site header and footer into every page.
// Each page contains <div data-site-header></div> and <div data-site-footer></div>
// placeholders; this script (loaded deferred, before app.js) fills them in and
// marks the current page's navigation link as active.
//
// To change menu labels, add a page, or edit the footer, update the data below.

(function () {
	'use strict';

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
				{ label: 'Dance with Us', href: '/get-involved/dance-with-us/' },
				{ label: 'Beginner Dancers', href: '/classes/beginner-dancers/' },
				{ label: 'Intermediate Dancers', href: '/classes/intermediate-dancers/' },
				{ label: 'Advanced Dancers', href: '/classes/advanced-dancers/' }
			]
		},
		{
			label: 'Events',
			items: [
				{ label: 'Events', href: '/events/' },
				{ label: 'Services', href: '/services/' }
			]
		},
		{
			label: 'Get Involved',
			items: [
				{ label: 'Book a Performance', href: '/get-involved/book-a-performance/' },
				{ label: 'See A Performance', href: '/get-involved/see-a-performance/' },
				{ label: 'Support Our Cause', href: '/get-involved/support-our-cause/' }
			]
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
				{ label: 'Splendid China 2008', href: '/splendid-china/2008/' }
			]
		}
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

	const currentPath = normalizePath(window.location.pathname);

	function isActive(href) {
		return normalizePath(href) === currentPath;
	}

	// ---------------------------------------------------------------------------
	// Header rendering
	// ---------------------------------------------------------------------------

	function esc(value) {
		return String(value)
			.replace(/[&]/g, '&amp;')
			.replace(/[<]/g, '&lt;')
			.replace(/[>]/g, '&gt;')
			.replace(/["]/g, '&quot;')
			.replace(/[']/g, '&#39;');
	}

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
		return `<li class="nav-item"><a href="${esc(item.href)}" class="nav-link${activeClass}"${currentAttr}>${esc(item.label)}</a></li>`;
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
					${esc(item.label)}
					${CARET_SVG}
				</button>
				<ul id="${menuId}" class="nav-dropdown" aria-label="${esc(item.label)} submenu">
					${item.items.map(navLink).join('')}
				</ul>
			</li>
		`;
	}

	function headerAction(action) {
		const active = isActive(action.href);
		const currentAttr = active ? ' aria-current="page"' : '';
		return `<a href="${esc(action.href)}" class="btn btn-primary header-cta" role="button" aria-label="${esc(action.ariaLabel || action.label)}"${currentAttr}>${esc(action.label)}</a>`;
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
					return `<li><span>${esc(link.label)}</span></li>`;
				}
				return `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`;
			}).join('');
			return `
					<section class="footer-column" aria-label="${esc(column.heading)}">
						<h2>${esc(column.heading)}</h2>
						<ul>${items}</ul>
					</section>`;
		}).join('');

		const operations = FOOTER.operations.map((op) => {
			if (!op.href) {
				return `<span>${esc(op.label)}</span>`;
			}
			return `<a href="${esc(op.href)}">${esc(op.label)}</a>`;
		}).join('<br>');

		return `
			<footer class="site-footer" role="contentinfo">
				<div class="container footer-inner">
					<section class="footer-brand" aria-label="${esc(FOOTER.brandText)}">
						<a href="${esc(FOOTER.homeHref)}" class="footer-logo" aria-label="${esc(FOOTER.brandText)} home">
							<span class="footer-logo-icon" aria-hidden="true">
								${LOGO_SVG_FOOTER}
							</span>
						</a>
						<p class="footer-brand-name">${esc(FOOTER.brandText)}</p>
						<p class="footer-mission">${esc(FOOTER.mission)}</p>
						<div class="footer-operations">${operations}</div>
					</section>

					<nav class="footer-directory" aria-label="Footer navigation">
						${columns}
					</nav>
				</div>
				<div class="container footer-bottom">
					<p class="footer-copy">${esc(FOOTER.copyright)}</p>
				</div>
			</footer>
		`;
	}

	// ---------------------------------------------------------------------------
	// Injection (runs immediately: deferred scripts execute after the document
	// is parsed, so the placeholders exist and app.js's DOMContentLoaded
	// handlers find the finished header/footer)
	// ---------------------------------------------------------------------------

	const headerMount = document.querySelector('[data-site-header]');
	if (headerMount) {
		headerMount.outerHTML = buildHeader();
	}

	const footerMount = document.querySelector('[data-site-footer]');
	if (footerMount) {
		footerMount.outerHTML = buildFooter();
	}
})();
