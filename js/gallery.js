// gallery.js — gallery carousels wired to the hardcoded markup in each
// page: prev/next buttons, dots, year tabs (archive pages), thumbnails,
// and the fullscreen lightbox

import { $, $$ } from './utils.js';

export function initGallery() {
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
		function closeLightbox() {
			if (!lightboxImage) return;
			lightbox.hidden = true;
			lightboxImage.removeAttribute('src');
			activeGalleryRunner?.startAutoScroll();
			activeGalleryRunner = null;
		}

		lightboxClose?.addEventListener('click', closeLightbox);
		lightbox.addEventListener('click', (event) => {
			if (event.target !== lightbox) return;
			closeLightbox();
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && !lightbox.hidden) {
				closeLightbox();
			}
		});
	}
}
