// Configuration
// Use window.location.host to connect to the same domain
// In Docker: backend is accessible via the network
// In development: backend is on localhost:3001
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : `http://${window.location.hostname}:3001`;
const API_ENDPOINT = `${BACKEND_URL}/chat`;

// Generate a unique conversation ID for this session
const CONVERSATION_ID = 'chat_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const sendBtn = document.getElementById('sendBtn');
const backendUrlSpan = document.getElementById('backendUrl');

// Set backend URL in the UI
backendUrlSpan.textContent = BACKEND_URL;

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Handle Enter key (Shift+Enter for new line)
userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

// Handle form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';

    // Disable send button
    sendBtn.disabled = true;

    // Add user message to chat
    addMessage(message, 'user');

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        // Send message to backend with conversation context
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: message,
                conversationId: CONVERSATION_ID,
                includeHistory: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Remove typing indicator
        removeMessage(typingId);

        // Add bot response
        if (data.response) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('No response from the model. Please try again.', 'bot', true);
        }

    } catch (error) {
        console.error('Error:', error);
        removeMessage(typingId);

        let errorMessage = 'Sorry, an error occurred while processing your request.';

        if (error instanceof TypeError) {
            errorMessage = `Cannot connect to the backend at ${BACKEND_URL}. Please make sure the server is running.`;
        } else if (error.message.includes('status: 500')) {
            errorMessage = 'The model server encountered an error. Please try again.';
        }

        addMessage(errorMessage, 'bot', true);
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
});

/**
 * Add a message to the chat
 * @param {string} text - Message text
 * @param {string} type - 'user' or 'bot'
 * @param {boolean} isError - Whether this is an error message
 */
function addMessage(text, type, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (isError) {
        contentDiv.innerHTML = `<div class="error-message">${escapeHtml(text)}</div>`;
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        contentDiv.appendChild(p);
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show typing indicator
 * @returns {string} ID of the typing indicator element
 */
function showTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    const id = 'typing-' + Date.now();
    messageDiv.id = id;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content typing-indicator';
    contentDiv.innerHTML = '<span></span><span></span><span></span>';

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return id;
}

/**
 * Remove a message by ID
 * @param {string} id - Element ID
 */
function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Focus on input when page loads
window.addEventListener('load', () => {
    userInput.focus();
});

// Log backend connection status
console.log(`UI initialized. Backend URL: ${BACKEND_URL}`);
