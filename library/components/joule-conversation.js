/**
 * Joule Conversation Component
 * A reusable conversation interface component for Joule AI interactions
 */
class JouleConversation {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            title: options.title || 'New Conversation',
            placeholder: options.placeholder || 'Message Joule...',
            disclaimer: options.disclaimer || 'Joule uses AI, verify results.',
            showTimestamp: options.showTimestamp !== false,
            onSendMessage: options.onSendMessage || this.defaultSendHandler.bind(this),
            onMenuClick: options.onMenuClick || this.defaultMenuHandler.bind(this),
            onOverflowClick: options.onOverflowClick || this.defaultOverflowHandler.bind(this),
            onFullscreenClick: options.onFullscreenClick || this.defaultFullscreenHandler.bind(this),
            onCloseClick: options.onCloseClick || this.defaultCloseHandler.bind(this),
            ...options
        };
        
        this.messages = [];
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const timestamp = new Date();
        const timeString = timestamp.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        const dateString = this.formatDate(timestamp);

        this.container.innerHTML = `
            <div class="joule-structure" data-name="joule-structure" data-node-id="2490:8452">
                <div class="header" data-name="Panel Header" data-node-id="2479:11018">
                    <div class="title-section" data-name="Title">
                        <div class="menu-section" data-name="Menu">
                            <div class="menu-button" data-name="Menu">
                                <div class="icon-container" data-name="Icon">
                                    <i class="sap-icon sap-icon--menu2"></i>
                                </div>
                            </div>
                        </div>
                        <div class="title-text">
                            <p>${this.options.title}</p>
                        </div>
                    </div>
                    <div class="toolbar-section" data-name="Tool Bar">
                        <div class="toolbar-button overflow-btn" data-name="Overflow">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--overflow"></i>
                            </div>
                        </div>
                        <div class="toolbar-button fullscreen-btn" data-name="Fullscreen">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--full-screen"></i>
                            </div>
                        </div>
                        <div class="toolbar-button close-btn" data-name="Close">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--decline"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content" data-name="content" data-node-id="2479:66260">
                    ${this.options.showTimestamp ? `
                    <div class="timestamp" data-name="Timestamp" data-node-id="2479:66261">
                        <div class="timestamp-text">
                            <p><span class="timestamp-bold">${dateString}</span><span class="timestamp-regular"> ${timeString}</span></p>
                        </div>
                    </div>
                    ` : ''}
                    <div class="messages-container"></div>
                </div>
                <div class="input" data-name="Input field" data-node-id="2479:66508">
                    <div class="input-container">
                        <div class="input-area" data-name="Input area">
                            <div class="input-elements" data-name="elements">
                                <div class="input-icon-section">
                                    <div class="input-icon-button attachment-btn" data-name="Icon Button">
                                        <div class="input-icon" data-name="Icon">
                                            <i class="sap-icon sap-icon--attachment"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="input-text-section" data-name="Text">
                                    <div class="input-placeholder">
                                        <p>${this.options.placeholder}</p>
                                    </div>
                                </div>
                                <div class="input-actions" data-name="Actions">
                                    <div class="input-send-button send-btn" data-name="Icon Button">
                                        <div class="input-send-icon" data-name="Icon">
                                            <i class="sap-icon sap-icon--paper-plane"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="blinking-cursor" data-name="Blinking Cursor">
                                    <div class="cursor"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="disclaimer" data-name="Disclaimer" data-node-id="2479:66290">
                    <div class="disclaimer-content" data-node-id="2475:53889">
                        <p>${this.options.disclaimer}</p>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Menu button
        this.container.querySelector('.menu-button').addEventListener('click', this.options.onMenuClick);
        
        // Toolbar buttons
        this.container.querySelector('.overflow-btn').addEventListener('click', this.options.onOverflowClick);
        this.container.querySelector('.fullscreen-btn').addEventListener('click', this.options.onFullscreenClick);
        this.container.querySelector('.close-btn').addEventListener('click', this.options.onCloseClick);
        
        // Send button
        const sendBtn = this.container.querySelector('.send-btn');
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Attachment button
        this.container.querySelector('.attachment-btn').addEventListener('click', this.options.onAttachmentClick || (() => {}));
        
        // Make the input area clickable to focus (for future functionality)
        const inputArea = this.container.querySelector('.input-text-section');
        inputArea.addEventListener('click', () => {
            // Future: could add input functionality here
        });
    }

    sendMessage() {
        // For now, just trigger the callback - no actual input to read
        this.options.onSendMessage('Sample message');
    }

    addMessage(type, content) {
        const message = { type, content, timestamp: new Date() };
        this.messages.push(message);
        this.renderMessage(message);
    }

    renderMessage(message) {
        const messagesContainer = this.container.querySelector('.messages-container');
        const messageElement = document.createElement('div');
        
        if (message.type === 'user') {
            messageElement.className = 'user-message';
            messageElement.innerHTML = `
                <div class="user-message-bubble">
                    <div class="user-message-content">
                        <p>${message.content}</p>
                    </div>
                </div>
            `;
        } else if (message.type === 'joule') {
            messageElement.className = 'joule-message';
            messageElement.innerHTML = `
                <div class="joule-message-bubble">
                    <div class="joule-message-content">
                        <p>${message.content}</p>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearMessages() {
        this.messages = [];
        const messagesContainer = this.container.querySelector('.messages-container');
        messagesContainer.innerHTML = '';
    }

    formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    // Default event handlers
    defaultSendHandler(message) {
        console.log('Message sent:', message);
        // Simulate Joule response after a delay
        setTimeout(() => {
            this.addMessage('joule', 'This is a sample response from Joule.');
        }, 1000);
    }

    defaultMenuHandler() {
        console.log('Menu clicked');
    }

    defaultOverflowHandler() {
        console.log('Overflow clicked');
    }

    defaultFullscreenHandler() {
        console.log('Fullscreen clicked');
    }

    defaultCloseHandler() {
        console.log('Close clicked');
    }

    // Public API methods
    setTitle(title) {
        this.options.title = title;
        this.container.querySelector('.title-text p').textContent = title;
    }

    addJouleMessage(content) {
        this.addMessage('joule', content);
    }

    addUserMessage(content) {
        this.addMessage('user', content);
    }

    getMessages() {
        return [...this.messages];
    }

    destroy() {
        this.container.innerHTML = '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JouleConversation;
}

// Make available globally
window.JouleConversation = JouleConversation;
