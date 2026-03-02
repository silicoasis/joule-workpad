/**
 * Joule4 Object Card Component
 * A reusable component for displaying object cards with interactive elements
 */
class Joule4ObjectCard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId) || document.querySelector('.container');
        this.options = {
            title: options.title || 'New Conversation',
            onMenuClick: options.onMenuClick || this.defaultMenuHandler.bind(this),
            onOverflowClick: options.onOverflowClick || this.defaultOverflowHandler.bind(this),
            onFullscreenClick: options.onFullscreenClick || this.defaultFullscreenHandler.bind(this),
            onCloseClick: options.onCloseClick || this.defaultCloseHandler.bind(this),
            onAttachmentClick: options.onAttachmentClick || this.defaultAttachmentHandler.bind(this),
            onSendClick: options.onSendClick || this.defaultSendHandler.bind(this),
            onButtonClick: options.onButtonClick || this.defaultButtonHandler.bind(this),
            ...options
        };
        
        this.init();
    }

    init() {
        this.renderInterface();
        this.attachEventListeners();
        this.initializeAnimations();
    }

    /**
     * Renders the complete interface HTML structure
     */
    renderInterface() {
        if (!this.container) return;

        const interfaceHTML = `
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
                        <div class="toolbar-button" data-name="Overflow">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--overflow"></i>
                            </div>
                        </div>
                        <div class="toolbar-button" data-name="Fullscreen">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--full-screen"></i>
                            </div>
                        </div>
                        <div class="toolbar-button" data-name="Close">
                            <div class="icon-container" data-name="Icon">
                                <i class="sap-icon sap-icon--decline"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content" data-name="content" data-node-id="2479:66260">
                    <div class="timestamp" data-name="Timestamp" data-node-id="2479:66261">
                        <div class="timestamp-text">
                            <p><span class="timestamp-bold">Today</span><span class="timestamp-regular"> 8:00 AM</span></p>
                        </div>
                    </div>
                    <div class="user-message" data-name="Text message/ User" data-node-id="2479:66262">
                        <div class="user-message-bubble" data-name="User message bubble">
                            <div class="user-message-content">
                                <p>Object card message</p>
                            </div>
                        </div>
                    </div>
                    <div class="object-card" data-name="Object Card" data-node-id="2500:34610">
                        <!-- Header -->
                        <div class="object-card-header" data-name="Header">
                            <div class="object-card-header-content" data-name="Header Content">
                                <div class="object-card-icon" data-name="product">
                                    <img src="http://localhost:3845/assets/4bf79b820a719305f5eaaa0e244da8f8aef02034.svg" alt="Product Icon" class="object-card-icon-img">
                                </div>
                                <div class="object-card-header-text" data-name="Header Content Text">
                                    <div class="object-card-title-row" data-name="Title">
                                        <div class="object-card-title">Card Title</div>
                                        <div class="object-card-status">Status</div>
                                    </div>
                                    <div class="object-card-subtitle">Card Subtitle</div>
                                    <div class="object-card-content">Content</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content -->
                        <div class="object-card-content-section" data-name="Content">
                            <div class="object-card-section-header">Section Header</div>
                            <div class="object-card-label-group" data-name="Short label">
                                <div class="object-card-label-title">Label Title</div>
                                <div class="object-card-label-content">Content</div>
                            </div>
                            <div class="object-card-label-group" data-name="Short label">
                                <div class="object-card-label-title">Label Title</div>
                                <div class="object-card-label-content">Content</div>
                            </div>
                            <div class="object-card-label-group" data-name="Short label">
                                <div class="object-card-label-title">Label Title</div>
                                <div class="object-card-label-content">Content</div>
                            </div>
                            <div class="object-card-label-group" data-name="Short label">
                                <div class="object-card-label-title">Label Title</div>
                                <div class="object-card-label-content">Content</div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="object-card-footer" data-name="Footer">
                            <button class="object-card-button">Approve</button>
                            <button class="object-card-button">Approve</button>
                            <button class="object-card-button">Approve</button>
                        </div>
                    </div>
                </div>
                <div class="input" data-name="Input field" data-node-id="2479:66508">
                    <div class="input-container">
                        <div class="input-area" data-name="Input area">
                            <div class="input-elements" data-name="elements">
                                <div class="input-icon-section">
                                    <div class="input-icon-button" data-name="Icon Button">
                                        <div class="input-icon" data-name="Icon">
                                            <i class="sap-icon sap-icon--attachment"></i>
                                        </div>
                                    </div>
                                </div>
                                <div class="input-text-section" data-name="Text">
                                    <div class="input-placeholder">
                                        <p>Message Joule...</p>
                                    </div>
                                </div>
                                <div class="input-actions" data-name="Actions">
                                    <div class="input-send-button" data-name="Icon Button">
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
                        <p>Joule uses AI, verify results.</p>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = interfaceHTML;
    }

    attachEventListeners() {
        if (!this.container) return;

        // Header buttons
        const menuButton = this.container.querySelector('.menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', this.options.onMenuClick);
        }

        const overflowButton = this.container.querySelector('.toolbar-button[data-name="Overflow"]');
        if (overflowButton) {
            overflowButton.addEventListener('click', this.options.onOverflowClick);
        }

        const fullscreenButton = this.container.querySelector('.toolbar-button[data-name="Fullscreen"]');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', this.options.onFullscreenClick);
        }

        const closeButton = this.container.querySelector('.toolbar-button[data-name="Close"]');
        if (closeButton) {
            closeButton.addEventListener('click', this.options.onCloseClick);
        }

        // Input area buttons
        const attachmentButton = this.container.querySelector('.input-icon-button');
        if (attachmentButton) {
            attachmentButton.addEventListener('click', this.options.onAttachmentClick);
        }

        const sendButton = this.container.querySelector('.input-send-button');
        if (sendButton) {
            sendButton.addEventListener('click', this.options.onSendClick);
        }

        // Object card buttons
        const cardButtons = this.container.querySelectorAll('.object-card-button');
        cardButtons.forEach((button, index) => {
            button.addEventListener('click', (e) => {
                this.options.onButtonClick(e, index, button.textContent);
            });
        });

        // Add hover effects to interactive elements
        this.addHoverEffects();
    }

    addHoverEffects() {
        // Add hover effects to toolbar buttons
        const toolbarButtons = this.container.querySelectorAll('.toolbar-button, .menu-button');
        toolbarButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'rgba(255, 255, 255, 0)';
            });
        });

        // Add hover effects to input buttons
        const inputButtons = this.container.querySelectorAll('.input-icon-button, .input-send-button');
        inputButtons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (button.classList.contains('input-send-button')) {
                    button.style.backgroundColor = '#0051cc';
                } else {
                    button.style.backgroundColor = 'rgba(0, 100, 217, 0.1)';
                }
            });
            button.addEventListener('mouseleave', () => {
                if (button.classList.contains('input-send-button')) {
                    button.style.backgroundColor = '#0070f2';
                } else {
                    button.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                }
            });
        });
    }

    initializeAnimations() {
        // Initialize the blinking cursor animation
        const cursor = this.container.querySelector('.cursor');
        if (cursor) {
            // Animation is handled by CSS, but we could add JS controls here if needed
        }
    }

    // Update object card content dynamically
    updateObjectCard(cardData) {
        const objectCard = this.container.querySelector('.object-card');
        if (!objectCard || !cardData) return;

        // Update title
        if (cardData.title) {
            const titleElement = objectCard.querySelector('.object-card-title');
            if (titleElement) titleElement.textContent = cardData.title;
        }

        // Update subtitle
        if (cardData.subtitle) {
            const subtitleElement = objectCard.querySelector('.object-card-subtitle');
            if (subtitleElement) subtitleElement.textContent = cardData.subtitle;
        }

        // Update status
        if (cardData.status) {
            const statusElement = objectCard.querySelector('.object-card-status');
            if (statusElement) statusElement.textContent = cardData.status;
        }

        // Update content sections
        if (cardData.sections) {
            cardData.sections.forEach((section, index) => {
                const labelGroups = objectCard.querySelectorAll('.object-card-label-group');
                if (labelGroups[index]) {
                    const titleEl = labelGroups[index].querySelector('.object-card-label-title');
                    const contentEl = labelGroups[index].querySelector('.object-card-label-content');
                    if (titleEl && section.title) titleEl.textContent = section.title;
                    if (contentEl && section.content) contentEl.textContent = section.content;
                }
            });
        }

        // Update buttons
        if (cardData.buttons) {
            const buttonElements = objectCard.querySelectorAll('.object-card-button');
            cardData.buttons.forEach((buttonText, index) => {
                if (buttonElements[index]) {
                    buttonElements[index].textContent = buttonText;
                }
            });
        }
    }

    // Update header title
    setTitle(title) {
        const titleElement = this.container.querySelector('.title-text p');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Show/hide loading state
    setLoading(isLoading) {
        const sendButton = this.container.querySelector('.input-send-button');
        if (sendButton) {
            if (isLoading) {
                sendButton.style.opacity = '0.5';
                sendButton.style.cursor = 'not-allowed';
            } else {
                sendButton.style.opacity = '1';
                sendButton.style.cursor = 'pointer';
            }
        }
    }

    // Default event handlers
    defaultMenuHandler() {
        console.log('Menu clicked');
    }

    defaultOverflowHandler() {
        console.log('Overflow menu clicked');
    }

    defaultFullscreenHandler() {
        console.log('Fullscreen clicked');
        // Could implement actual fullscreen functionality
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            this.container.requestFullscreen?.();
        }
    }

    defaultCloseHandler() {
        console.log('Close clicked');
        // Could implement close functionality
    }

    defaultAttachmentHandler() {
        console.log('Attachment clicked');
        // Could implement file attachment functionality
    }

    defaultSendHandler() {
        console.log('Send clicked');
        // Could implement send message functionality
    }

    defaultButtonHandler(event, index, buttonText) {
        console.log(`Object card button clicked: ${buttonText} (index: ${index})`);
        // Could implement specific button actions
        
        // Example: Add visual feedback
        const button = event.target;
        const originalBg = button.style.backgroundColor;
        button.style.backgroundColor = 'rgba(0, 100, 217, 0.2)';
        setTimeout(() => {
            button.style.backgroundColor = originalBg;
        }, 200);
    }

    // Public API methods
    getContainer() {
        return this.container;
    }

    destroy() {
        // Remove event listeners and clean up
        if (this.container) {
            const buttons = this.container.querySelectorAll('button, .toolbar-button, .menu-button, .input-icon-button, .input-send-button');
            buttons.forEach(button => {
                button.replaceWith(button.cloneNode(true));
            });
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Joule4ObjectCard;
}

// Make available globally
window.Joule4ObjectCard = Joule4ObjectCard;

// Auto-initialize if DOM is ready and container exists
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    if (container && !window.joule4Instance) {
        window.joule4Instance = new Joule4ObjectCard();
        console.log('Joule4 Object Card initialized');
    }
});
