/**
 * AttachmentManager - Handles file attachments and input functionality
 */
class AttachmentManager {
    constructor() {
        this.files = [];
        this.maxFiles = 10;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
        
        this.init();
    }
    
    /**
     * Render the complete chat interface
     */
    static renderChatInterface() {
        const chatHTML = `
            <div class="chat-container joule-structure">
                <!-- Header -->
                <div class="panel-header">
                    <div class="header-title">
                        <button class="header-button menu-button" aria-label="Menu">
                            <span class="icon icon-menu"></span>
                        </button>
                        <span class="title-text">New Conversation</span>
                    </div>
                    <div class="toolbar">
                        <button class="header-button toolbar-button" aria-label="More options">
                            <span class="icon icon-overflow"></span>
                        </button>
                        <button class="header-button toolbar-button" aria-label="Fullscreen">
                            <span class="icon icon-fullscreen"></span>
                        </button>
                        <button class="header-button toolbar-button" aria-label="Close">
                            <span class="icon icon-close"></span>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="content">
                    <!-- Timestamp -->
                    <div class="timestamp">
                        <div class="timestamp-text">
                            <span class="timestamp-bold">Today</span> 8:00 AM
                        </div>
                    </div>
                    
                    <!-- User Message -->
                    <div class="message-container">
                        <div class="user-message">
                            <div class="user-message-bubble">
                                <div class="user-message-text">User's message</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Joule Message -->
                    <div class="message-container">
                        <div class="joule-message">
                            <div class="joule-message-bubble">
                                <div class="joule-message-text">Here is a message sent by Joule to the user (max width is restrained; just press enter for line break)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Input Field -->
                <div class="input-field">
                    <div class="input-area">
                        <!-- File List -->
                        <div class="file-list">
                            <!-- Files will be dynamically added here -->
                        </div>
                        
                        <!-- Input Elements -->
                        <div class="input-elements">
                            <i class="sap-icon sap-icon--attachment attachment-icon" aria-label="Attach files"></i>
                            
                            <div class="text-input" contenteditable="true">Donec id elit non mi porta gravida at get metus. Duis mollis, est non commodo luctus, nisi erat amet non magna. Nullam blandit quis dapibus ac facilisis risus eget urna mollis ornare vel eu lamet non magna. Nullam blandit quis dapibus aeo. Donec ullamcorper Nullam blandit quis dapibus aac facilisis risus eget urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus auctor fringilla. Maecenas sed diam eget risus varius varius blandit sit amet nonetal magna. Morbi leo risus Vestiblum id ligula porta felis euismod semper. Cum. Donec ullamcorper.</div>
                            
                            <div class="input-actions">
                                <button class="clear-button" aria-label="Clear input">
                                    <i class="sap-icon sap-icon--decline"></i>
                                </button>
                                <button class="send-button active" aria-label="Send message">
                                    <i class="sap-icon sap-icon--paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Disclaimer -->
                <div class="disclaimer">
                    <div class="disclaimer-text">Joule uses AI, verify results.</div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = chatHTML;
    }
    
    init() {
        this.bindEvents();
        this.loadExistingFiles();
    }
    
    bindEvents() {
        // Attachment icon click handler
        const attachmentIcon = document.querySelector('.attachment-icon');
        if (attachmentIcon) {
            attachmentIcon.addEventListener('click', () => this.openFileDialog());
        }
        
        // File delete handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.file-delete-container')) {
                const fileItem = e.target.closest('.file-item');
                if (fileItem) {
                    this.removeFile(fileItem);
                }
            }
        });
        
        // Send button handler
        const sendButton = document.querySelector('.send-button');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Clear button handler
        const clearButton = document.querySelector('.clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearInput());
        }
        
        // Text input handlers
        const textInput = document.querySelector('.text-input');
        if (textInput) {
            textInput.addEventListener('input', () => this.updateSendButtonState());
            textInput.addEventListener('paste', (e) => this.handlePaste(e));
        }
        
        // Drag and drop handlers
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            inputArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            inputArea.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }
    
    loadExistingFiles() {
        // Add some demo files for demonstration - matching Figma design exactly
        const demoFiles = [
            { name: 'Sharon maternity leave.PDF', type: 'pdf', index: 0 },
            { name: 'Sharon maternity leave.PDF', type: 'pdf', index: 1 },
            { name: 'Dr Jennifer handwritten note.img', type: 'jpg', index: 2 },
            { name: 'Sharon activity report.csv', type: 'csv', selected: true, index: 3 },
            { name: 'Sharon activity report.csv', type: 'csv', index: 4 }
        ];
        
        demoFiles.forEach((demoFile, index) => {
            const fileData = {
                id: `demo-${index}`,
                name: demoFile.name,
                type: demoFile.type,
                size: Math.floor(Math.random() * 1000000) + 50000, // Random size between 50KB and 1MB
                isExisting: true,
                isDemo: true,
                selected: demoFile.selected || false,
                designIndex: demoFile.index
            };
            
            this.files.push(fileData);
            this.createFileElement(fileData);
        });
        
        this.updateFileList();
    }
    
    openFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = this.getAllowedTypesString();
        
        input.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        input.click();
    }
    
    handleFileSelection(files) {
        Array.from(files).forEach(file => {
            if (this.validateFile(file)) {
                this.addFile(file);
            }
        });
    }
    
    validateFile(file) {
        // Check file count limit
        if (this.files.length >= this.maxFiles) {
            this.showError(`Maximum ${this.maxFiles} files allowed`);
            return false;
        }
        
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
            return false;
        }
        
        // Check file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!this.allowedTypes.includes(fileExtension)) {
            this.showError(`File type "${fileExtension}" is not allowed`);
            return false;
        }
        
        return true;
    }
    
    addFile(file) {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        const fileData = {
            id: fileId,
            name: file.name,
            type: fileExtension,
            size: file.size,
            file: file,
            isExisting: false
        };
        
        this.files.push(fileData);
        this.createFileElement(fileData);
        this.updateFileList();
        this.updateSendButtonState();
    }
    
    createFileElement(fileData) {
        const fileList = document.querySelector('.file-list');
        if (!fileList) return;
        
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.setAttribute('data-file-id', fileData.id);
        
        // Determine styling based on design index from Figma
        const designIndex = fileData.designIndex !== undefined ? fileData.designIndex : this.files.length - 1;
        let textColor = '#1d2d3e'; // Default text color for first 3 items
        let backgroundColor = '';
        
        // Apply Figma design styling exactly
        if (fileData.selected) {
            // Selected item (4th item in design - index 3)
            backgroundColor = 'background-color: #eaecee;';
            textColor = '#1d232a';
        } else if (designIndex === 4) {
            // Last item (5th item - index 4) uses darker text
            textColor = '#1d232a';
        }
        
        fileElement.innerHTML = `
            <div class="file-leading">
                <div class="file-icon-container">
                    <i class="sap-icon sap-icon--accept" style="color: #107e3e !important;"></i>
                </div>
            </div>
            <div class="file-text-container">
                <p style="color: ${textColor};">${fileData.name}</p>
            </div>
            <div class="file-trailing">
                <div class="file-delete-container">
                    <i class="sap-icon sap-icon--decline"></i>
                </div>
            </div>
        `;
        
        // Apply background styling if needed
        if (backgroundColor) {
            fileElement.style.cssText = backgroundColor;
        }
        
        fileList.appendChild(fileElement);
        fileData.element = fileElement;
    }
    
    removeFile(fileElement) {
        const fileId = fileElement.getAttribute('data-file-id');
        if (!fileId) {
            // Handle existing files without IDs
            const fileName = fileElement.querySelector('.file-text-container p').textContent;
            this.files = this.files.filter(f => f.name !== fileName);
        } else {
            this.files = this.files.filter(f => f.id !== fileId);
        }
        
        fileElement.remove();
        this.updateFileList();
        this.updateSendButtonState();
    }
    
    getFileIcon(fileType) {
        const iconMap = {
            'pdf': 'pdf-attachment',
            'doc': 'doc-attachment',
            'docx': 'doc-attachment',
            'txt': 'document-text',
            'csv': 'excel-attachment',
            'xlsx': 'excel-attachment',
            'jpg': 'picture',
            'jpeg': 'picture',
            'png': 'picture',
            'gif': 'picture'
        };
        
        return iconMap[fileType] || 'attachment';
    }
    
    getFileIconColor(fileType) {
        const colorMap = {
            'pdf': '#ff4444',
            'doc': '#2b579a',
            'docx': '#2b579a',
            'txt': '#666666',
            'csv': '#217346',
            'xlsx': '#217346',
            'jpg': '#ff6b35',
            'jpeg': '#ff6b35',
            'png': '#ff6b35',
            'gif': '#ff6b35'
        };
        
        return colorMap[fileType] || '#666666';
    }
    
    updateFileList() {
        const fileList = document.querySelector('.file-list');
        if (!fileList) return;
        
        // Show/hide file list based on file count
        if (this.files.length === 0) {
            fileList.style.display = 'none';
        } else {
            fileList.style.display = 'block';
        }
        
        // Update file count indicator if it exists
        this.updateFileCountIndicator();
    }
    
    updateFileCountIndicator() {
        // File count indicator removed - not part of design
        return;
    }
    
    sendMessage() {
        const textInput = document.querySelector('.text-input');
        const message = textInput ? textInput.textContent.trim() : '';
        
        if (!message && this.files.length === 0) {
            this.showError('Please enter a message or attach files');
            return;
        }
        
        // Create message data
        const messageData = {
            message: message,
            attachments: this.files.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                size: f.size
            })),
            timestamp: new Date().toISOString()
        };
        
        // Dispatch custom event
        const event = new CustomEvent('messageSend', {
            detail: messageData,
            bubbles: true
        });
        
        document.querySelector('.joule-structure').dispatchEvent(event);
        
        // Clear input after sending
        this.clearInput();
    }
    
    clearInput() {
        const textInput = document.querySelector('.text-input');
        if (textInput) {
            textInput.textContent = '';
        }
        
        // Clear all files
        this.files = [];
        const fileList = document.querySelector('.file-list');
        if (fileList) {
            fileList.innerHTML = '';
        }
        
        this.updateFileList();
        this.updateSendButtonState();
    }
    
    updateSendButtonState() {
        const sendButton = document.querySelector('.send-button');
        const textInput = document.querySelector('.text-input');
        
        if (!sendButton) return;
        
        const hasText = textInput && textInput.textContent.trim().length > 0;
        const hasFiles = this.files.length > 0;
        
        if (hasText || hasFiles) {
            sendButton.classList.add('active');
        } else {
            sendButton.classList.remove('active');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            inputArea.classList.add('drag-over');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
            inputArea.classList.remove('drag-over');
        }
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileSelection(files);
        }
    }
    
    handlePaste(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (item.kind === 'file') {
                e.preventDefault();
                const file = item.getAsFile();
                if (this.validateFile(file)) {
                    this.addFile(file);
                }
            }
        }
    }
    
    showError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'attachment-error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    getAllowedTypesString() {
        return this.allowedTypes.map(type => `.${type}`).join(',');
    }
    
    // Public API methods
    getFiles() {
        return this.files;
    }
    
    setTextContent(content) {
        const textInput = document.querySelector('.text-input');
        if (textInput) {
            textInput.textContent = content;
            this.updateSendButtonState();
        }
    }
    
    getTextContent() {
        const textInput = document.querySelector('.text-input');
        return textInput ? textInput.textContent.trim() : '';
    }
    
    addFileFromData(fileName, fileData, fileType) {
        const file = new File([fileData], fileName, { type: fileType });
        if (this.validateFile(file)) {
            this.addFile(file);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AttachmentManager;
}

// Initialize the chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Render the chat interface
    AttachmentManager.renderChatInterface();
    
    // Initialize the attachment manager
    const attachmentManager = new AttachmentManager();
    
    // Listen for message send events
    document.querySelector('.joule-structure').addEventListener('messageSend', function(event) {
        console.log('Message sent:', event.detail.message);
        console.log('Attachments:', event.detail.attachments);
        
        // Add message to chat
        addMessageToChat(event.detail.message, 'user');
        
        // Simulate Joule response
        setTimeout(() => {
            addMessageToChat('Thank you for your message! I\'ve analyzed the attached files and can help you with your request.', 'joule');
        }, 1000);
    });
    
    // Function to add messages to chat
    function addMessageToChat(message, sender) {
        const content = document.querySelector('.content');
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        
        if (sender === 'user') {
            messageContainer.innerHTML = `
                <div class="user-message">
                    <div class="user-message-bubble">
                        <div class="user-message-text">${message}</div>
                    </div>
                </div>
            `;
        } else {
            messageContainer.innerHTML = `
                <div class="joule-message">
                    <div class="joule-message-bubble">
                        <div class="joule-message-text">${message}</div>
                    </div>
                </div>
            `;
        }
        
        content.appendChild(messageContainer);
        content.scrollTop = content.scrollHeight;
    }
    
    // File selection handling
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.file-delete-container')) {
                // Toggle selection
                this.classList.toggle('selected');
            }
        });
    });
    
    // Clear button functionality
    document.querySelector('.clear-button').addEventListener('click', function() {
        const textInput = document.querySelector('.text-input');
        if (textInput) {
            textInput.textContent = '';
        }
        attachmentManager.updateSendButtonState();
    });
    
    console.log('Joule5 Chat Interface - Ready!');
    console.log('Attachment manager initialized');
    console.log('Current files:', attachmentManager.getFiles());
    
    // Update send button state on page load
    attachmentManager.updateSendButtonState();
});
