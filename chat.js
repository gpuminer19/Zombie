// ============= СИСТЕМА ЧАТА =============

const CHAT_STORAGE_KEY = 'global_chat_messages';
const MAX_MESSAGES = 100;
const MESSAGE_TTL = 24 * 60 * 60 * 1000;

let chatMessages = [];
let isChatOpen = false;

function initChat() {
    loadChatHistory();
    setupEventListeners();
    updateLastMessagePreview();
}

function loadChatHistory() {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
        try {
            chatMessages = JSON.parse(saved);
            const now = Date.now();
            chatMessages = chatMessages.filter(msg => now - msg.timestamp < MESSAGE_TTL);
            renderChatMessages();
            updateLastMessagePreview();
        } catch(e) {
            console.error('Ошибка загрузки чата:', e);
            chatMessages = [];
        }
    }
}

function saveChatHistory() {
    if (chatMessages.length > MAX_MESSAGES) {
        chatMessages = chatMessages.slice(-MAX_MESSAGES);
    }
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
}

function addChatMessage(username, text, isSystem = false) {
    const message = {
        id: Date.now() + Math.random(),
        username: username,
        text: text,
        timestamp: Date.now(),
        isSystem: isSystem
    };
    
    chatMessages.push(message);
    saveChatHistory();
    renderChatMessages();
    updateLastMessagePreview();
    
    if (!isSystem) {
        broadcastMessage(message);
    }
    
    if (!isChatOpen && !isSystem) {
        showNewMessageNotification();
    }
}

function broadcastMessage(message) {
    try {
        const bc = new BroadcastChannel('game_chat');
        bc.postMessage({ type: 'new_message', message: message });
        setTimeout(() => bc.close(), 100);
    } catch(e) {}
}

function renderChatMessages() {
    const container = document.getElementById('chatPopupMessages');
    if (!container) return;
    
    const wasScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    
    container.innerHTML = '';
    
    chatMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = msg.isSystem ? 'chat-msg system' : 'chat-msg';
        
        if (!msg.isSystem) {
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            msgDiv.innerHTML = `
                <span class="msg-name">${escapeHtml(msg.username)}</span>
                <span class="msg-text">${escapeHtml(msg.text)}</span>
                <span class="msg-time">${time}</span>
            `;
        } else {
            msgDiv.innerHTML = `<span class="msg-text">💬 ${escapeHtml(msg.text)}</span>`;
        }
        
        container.appendChild(msgDiv);
    });
    
    if (wasScrolledToBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

function updateLastMessagePreview() {
    const container = document.getElementById('lastMessagePreview');
    if (!container) return;
    
    const lastMessage = [...chatMessages].reverse().find(msg => !msg.isSystem);
    
    if (!lastMessage) {
        container.innerHTML = '<span class="last-msg-content">Нет сообщений</span>';
        return;
    }
    
    let messageText = lastMessage.text;
    if (messageText.length > 30) {
        messageText = messageText.slice(0, 27) + '...';
    }
    
    let username = lastMessage.username;
    if (username.length > 12) {
        username = username.slice(0, 9) + '...';
    }
    
    container.innerHTML = `
        <span class="last-msg-name">${escapeHtml(username)}:</span>
        <span class="last-msg-content">${escapeHtml(messageText)}</span>
    `;
}

function showNewMessageNotification() {
    const button = document.getElementById('chatTriggerButton');
    if (button && !isChatOpen) {
        button.classList.add('new');
        setTimeout(() => button.classList.remove('new'), 600);
    }
}

function setupEventListeners() {
    const triggerBtn = document.getElementById('chatTriggerButton');
    const popup = document.getElementById('chatPopup');
    const closeBtn = document.getElementById('chatPopupCloseBtn');
    const sendBtn = document.getElementById('chatPopupSendBtn');
    const input = document.getElementById('chatPopupInput');
    
    if (triggerBtn) {
        triggerBtn.addEventListener('click', toggleChat);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeChat);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    document.addEventListener('click', (e) => {
        if (isChatOpen && popup && !popup.contains(e.target) && !triggerBtn?.contains(e.target)) {
            closeChat();
        }
    });
    
    try {
        const bc = new BroadcastChannel('game_chat');
        bc.onmessage = (event) => {
            if (event.data.type === 'new_message') {
                const msg = event.data.message;
                if (!chatMessages.some(m => m.id === msg.id)) {
                    chatMessages.push(msg);
                    saveChatHistory();
                    renderChatMessages();
                    updateLastMessagePreview();
                    if (!isChatOpen) showNewMessageNotification();
                }
            }
        };
    } catch(e) {}
}

function toggleChat() {
    if (isChatOpen) {
        closeChat();
    } else {
        openChat();
    }
}

function openChat() {
    const popup = document.getElementById('chatPopup');
    if (popup) {
        popup.classList.add('open');
        isChatOpen = true;
        
        setTimeout(() => {
            const input = document.getElementById('chatPopupInput');
            input?.focus();
            const container = document.getElementById('chatPopupMessages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

function closeChat() {
    const popup = document.getElementById('chatPopup');
    if (popup) {
        popup.classList.remove('open');
        isChatOpen = false;
    }
}

function sendMessage() {
    const input = document.getElementById('chatPopupInput');
    const text = input?.value.trim();
    
    if (!text) return;
    
    let playerName = localStorage.getItem('playerName');
    if (!playerName) {
        playerName = prompt('Введите ваше имя:', 'БОЕЦ');
        if (!playerName) playerName = 'БОЕЦ';
        playerName = playerName.slice(0, 15);
        localStorage.setItem('playerName', playerName);
    }
    
    const nameSpan = document.getElementById('playerName');
    if (nameSpan) nameSpan.innerText = playerName;
    
    addChatMessage(playerName, text);
    input.value = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    initChat();
    
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        const nameSpan = document.getElementById('playerName');
        if (nameSpan) nameSpan.innerText = savedName;
    }
});

window.chatAPI = { sendMessage, getMessages: () => [...chatMessages] };