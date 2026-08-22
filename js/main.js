// main.js — single entry point for all runtime behavior. Pages load only
// this file (<script type="module" src="/js/main.js">); module scripts are
// deferred by default and execute after the document is parsed, so each
// init runs on a complete DOM (no DOMContentLoaded wrapper needed).

import { initNavigation } from './navigation.js';
import { initAnnouncement, ANNOUNCEMENT_DISMISS_KEY } from './announcement.js';
import { initStarfield } from './starfield.js';
import { initZeffy } from './zeffy.js';
import { initGallery } from './gallery.js';
import { initChatbot, CHATBOT_MESSAGES_KEY } from './chatbot.js';

// A reload wipes session-scoped state so refreshed pages start fresh
// (announcement reappears, chat history resets)
const navigationEntry = performance.getEntriesByType?.('navigation')?.[0];
if (navigationEntry?.type === 'reload') {
	sessionStorage.removeItem(ANNOUNCEMENT_DISMISS_KEY);
	sessionStorage.removeItem(CHATBOT_MESSAGES_KEY);
}

// Order matters: navigation injects the header/footer that the other
// modules query.
initNavigation();
initAnnouncement();
initStarfield();
initZeffy();
initGallery();
initChatbot();
