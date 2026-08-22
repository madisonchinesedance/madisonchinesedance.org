// chatbot.js — MCDA Assistant chatbot: renders its markup, manages the
// panel toggle, page-specific suggested prompts, sessionStorage history,
// and talks to the Cloudflare Worker backend.
// Chatbot styles live in css/chatbot.css.

import { $, escapeHtml, markdownToHtml } from './utils.js';

export const CHATBOT_MESSAGES_KEY = 'mcda-chatbot-messages';

// Cloudflare Worker endpoint
const CHATBOT_API_ENDPOINT = 'https://assistant.madisonchinesedance.org';

// Page-specific suggested prompts (keyed by body[data-route])
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

export function initChatbot() {
	renderChatbot();

	const pageRouteId = document.body.getAttribute('data-route') || 'home';

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

	if (!chatbot || !chatbotToggle || !chatbotPanel) return;

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
