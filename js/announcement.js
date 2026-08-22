// announcement.js — site announcement bar: dismiss button + scrolling text
// when the announcement body overflows the available width

import { $ } from './utils.js';

export const ANNOUNCEMENT_DISMISS_KEY = 'mcda-announcement-dismissed';

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

export function initAnnouncement() {
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
}
