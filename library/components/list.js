/**
 * Adaptive List Component JavaScript
 * Handles dynamic list rendering and interactions for various business entities
 */

class List {
    constructor(element) {
        this.listElement = element;
        this.items = [];
        this.entityTypes = this.initializeEntityTypes();
        
        this.init();
    }
    
    init() {
        // Set up event listeners for list interactions
        this.setupEventListeners();
    }
    
    // Initialize supported entity types with their configurations
    initializeEntityTypes() {
        return {
            'sales orders': {
                icon: 'sap-icon--sales-order',
                title: 'Sales Orders',
                fields: ['Order ID', 'Customer', 'Amount', 'Status', 'Date'],
                generateData: (count) => this.generateSalesOrders(count)
            },
            'purchase orders': {
                icon: 'sap-icon--purchase-order',
                title: 'Purchase Orders', 
                fields: ['PO Number', 'Supplier', 'Total', 'Status', 'Due Date'],
                generateData: (count) => this.generatePurchaseOrders(count)
            },
            'products': {
                icon: 'sap-icon--product',
                title: 'Products',
                fields: ['Product ID', 'Name', 'Category', 'Price', 'Stock'],
                generateData: (count) => this.generateProducts(count)
            },
            'customers': {
                icon: 'sap-icon--customer',
                title: 'Customers',
                fields: ['Customer ID', 'Name', 'Email', 'Location', 'Status'],
                generateData: (count) => this.generateCustomers(count)
            },
            'invoices': {
                icon: 'sap-icon--invoice',
                title: 'Invoices',
                fields: ['Invoice #', 'Customer', 'Amount', 'Status', 'Due Date'],
                generateData: (count) => this.generateInvoices(count)
            },
            'suppliers': {
                icon: 'sap-icon--supplier',
                title: 'Suppliers',
                fields: ['Supplier ID', 'Company', 'Contact', 'Category', 'Rating'],
                generateData: (count) => this.generateSuppliers(count)
            },
            'tasks': {
                icon: 'sap-icon--task',
                title: 'Tasks',
                fields: ['Task ID', 'Title', 'Assignee', 'Priority', 'Due Date'],
                generateData: (count) => this.generateTasks(count)
            },
            'projects': {
                icon: 'sap-icon--project',
                title: 'Projects',
                fields: ['Project ID', 'Name', 'Manager', 'Status', 'Progress'],
                generateData: (count) => this.generateProjects(count)
            }
        };
    }
    
    setupEventListeners() {
        // Add event listeners for list item buttons
        this.listElement.addEventListener('click', (e) => {
            if (e.target.classList.contains('list-item-button')) {
                this.handleItemButtonClick(e.target);
            }
            
            if (e.target.classList.contains('list-footer-button')) {
                this.handleFooterButtonClick(e.target);
            }
            
            if (e.target.classList.contains('list-footer-view-more')) {
                this.handleViewMoreClick(e.target);
            }
        });
    }
    
    // Parse user request to extract entity type and count
    parseRequest(request) {
        const lowerRequest = request.toLowerCase();
        let entityType = null;
        let count = 5; // default count

        // Extract count from request
        const countMatch = lowerRequest.match(/(\d+)/);
        if (countMatch) {
            count = parseInt(countMatch[1]);
        }

        // Find entity type
        for (const [type, config] of Object.entries(this.entityTypes)) {
            if (lowerRequest.includes(type) || lowerRequest.includes(type.slice(0, -1))) {
                entityType = type;
                break;
            }
        }

        return { entityType, count: Math.min(count, 50) }; // Cap at 50 items
    }
    
    handleItemButtonClick(button) {
        // Handle list item button clicks
        const listItem = button.closest('.list-item');
        const title = listItem.querySelector('.list-item-title').textContent;
        
        // Emit custom event
        this.listElement.dispatchEvent(new CustomEvent('itemButtonClick', {
            detail: { title, button }
        }));
    }
    
    handleFooterButtonClick(button) {
        // Handle footer button clicks
        this.listElement.dispatchEvent(new CustomEvent('footerButtonClick', {
            detail: { button }
        }));
    }
    
    handleViewMoreClick(button) {
        // Handle view more button clicks
        this.listElement.dispatchEvent(new CustomEvent('viewMoreClick', {
            detail: { button }
        }));
    }
    
    // Public API methods
    addItem(item) {
        this.items.push(item);
        this.render();
    }
    
    removeItem(index) {
        this.items.splice(index, 1);
        this.render();
    }
    
    updateItem(index, item) {
        this.items[index] = item;
        this.render();
    }
    
    // Data generation methods for different entity types
    generateSalesOrders(count) {
        const customers = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems'];
        const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Order ID': `SO-${String(1000 + i).padStart(4, '0')}`,
            'Customer': customers[i % customers.length],
            'Amount': `$${(Math.random() * 50000 + 1000).toFixed(2)}`,
            'Status': statuses[i % statuses.length],
            'Date': this.getRandomDate()
        }));
    }

    generatePurchaseOrders(count) {
        const suppliers = ['Office Supplies Co', 'Tech Equipment Ltd', 'Industrial Parts Inc', 'Software Solutions', 'Hardware Direct'];
        const statuses = ['Draft', 'Approved', 'Ordered', 'Received', 'Closed'];
        
        return Array.from({ length: count }, (_, i) => ({
            'PO Number': `PO-${String(2000 + i).padStart(4, '0')}`,
            'Supplier': suppliers[i % suppliers.length],
            'Total': `$${(Math.random() * 25000 + 500).toFixed(2)}`,
            'Status': statuses[i % statuses.length],
            'Due Date': this.getRandomFutureDate()
        }));
    }

    generateProducts(count) {
        const categories = ['Electronics', 'Office Supplies', 'Software', 'Hardware', 'Accessories'];
        const products = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner', 'Tablet', 'Phone'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Product ID': `PRD-${String(3000 + i).padStart(4, '0')}`,
            'Name': `${products[i % products.length]} ${String.fromCharCode(65 + (i % 26))}`,
            'Category': categories[i % categories.length],
            'Price': `$${(Math.random() * 2000 + 50).toFixed(2)}`,
            'Stock': Math.floor(Math.random() * 100)
        }));
    }

    generateCustomers(count) {
        const names = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson', 'Lisa Garcia', 'Tom Anderson', 'Maria Rodriguez'];
        const locations = ['New York', 'California', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia'];
        const statuses = ['Active', 'Inactive', 'Pending', 'VIP', 'New'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Customer ID': `CUST-${String(4000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Email': `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
            'Location': locations[i % locations.length],
            'Status': statuses[i % statuses.length]
        }));
    }

    generateInvoices(count) {
        const customers = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems'];
        const statuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Invoice #': `INV-${String(5000 + i).padStart(4, '0')}`,
            'Customer': customers[i % customers.length],
            'Amount': `$${(Math.random() * 15000 + 500).toFixed(2)}`,
            'Status': statuses[i % statuses.length],
            'Due Date': this.getRandomFutureDate()
        }));
    }

    generateSuppliers(count) {
        const companies = ['Global Supply Co', 'Premium Parts Ltd', 'Quality Materials Inc', 'Reliable Vendors LLC', 'Top Tier Suppliers'];
        const contacts = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
        const categories = ['Raw Materials', 'Components', 'Services', 'Equipment', 'Software'];
        const ratings = ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Supplier ID': `SUP-${String(6000 + i).padStart(4, '0')}`,
            'Company': companies[i % companies.length],
            'Contact': contacts[i % contacts.length],
            'Category': categories[i % categories.length],
            'Rating': ratings[i % ratings.length]
        }));
    }

    generateTasks(count) {
        const titles = ['Review Documentation', 'Update System', 'Client Meeting', 'Code Review', 'Testing Phase', 'Deploy Application', 'Bug Fixes', 'Feature Development'];
        const assignees = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const priorities = ['High', 'Medium', 'Low', 'Critical', 'Normal'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Task ID': `TSK-${String(7000 + i).padStart(4, '0')}`,
            'Title': titles[i % titles.length],
            'Assignee': assignees[i % assignees.length],
            'Priority': priorities[i % priorities.length],
            'Due Date': this.getRandomFutureDate()
        }));
    }

    generateProjects(count) {
        const names = ['Website Redesign', 'Mobile App', 'Database Migration', 'API Integration', 'Security Audit', 'Performance Optimization', 'User Training', 'System Upgrade'];
        const managers = ['Sarah Connor', 'John Matrix', 'Ellen Ripley', 'Luke Skywalker', 'Diana Prince', 'Bruce Wayne', 'Tony Stark', 'Natasha Romanoff'];
        const statuses = ['Planning', 'In Progress', 'Testing', 'Completed', 'On Hold'];
        
        return Array.from({ length: count }, (_, i) => ({
            'Project ID': `PRJ-${String(8000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Manager': managers[i % managers.length],
            'Status': statuses[i % statuses.length],
            'Progress': `${Math.floor(Math.random() * 100)}%`
        }));
    }

    // Utility functions
    getRandomDate() {
        const start = new Date(2024, 0, 1);
        const end = new Date();
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toLocaleDateString();
    }

    getRandomFutureDate() {
        const start = new Date();
        const end = new Date(2025, 11, 31);
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toLocaleDateString();
    }

    // Main method to generate list from user request
    generateFromRequest(request) {
        const { entityType, count } = this.parseRequest(request);
        
        if (!entityType || !this.entityTypes[entityType]) {
            return this.generateErrorResponse(request);
        }

        const config = this.entityTypes[entityType];
        const data = config.generateData(count);
        this.items = data;
        
        return this.renderDynamicList(entityType, data, count);
    }

    generateErrorResponse(request) {
        const availableTypes = Object.keys(this.entityTypes).join(', ');
        return {
            error: true,
            message: `Could not understand request: "${request}". Available types: ${availableTypes}`
        };
    }

    renderDynamicList(entityType, data, count) {
        const config = this.entityTypes[entityType];
        
        // Update the list header
        const headerTitle = this.listElement.querySelector('.list-header-title');
        const headerCount = this.listElement.querySelector('.list-header-count');
        const headerIcon = this.listElement.querySelector('.list-header-avatar i');
        
        if (headerTitle) headerTitle.textContent = config.title;
        if (headerCount) headerCount.textContent = `${count} items`;
        if (headerIcon) headerIcon.className = `sap-icon ${config.icon}`;
        
        // Update list content
        const listContent = this.listElement.querySelector('.list-content');
        if (listContent) {
            listContent.innerHTML = '';
            
            data.forEach((item, index) => {
                const listItem = this.createListItem(item, config.fields, index);
                listContent.appendChild(listItem);
            });
        }
        
        return { success: true, entityType, count, data };
    }

    createListItem(item, fields, index) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-index', index);
        
        // Primary field (first field) as title
        const primaryField = fields[0];
        const primaryValue = item[primaryField];
        
        // Secondary field as subtitle
        const secondaryField = fields[1];
        const secondaryValue = item[secondaryField];
        
        // Third field as description
        const descriptionField = fields[2];
        const descriptionValue = item[descriptionField];
        
        // Status field (usually the second to last field)
        const statusField = fields[fields.length - 2] || fields[fields.length - 1];
        const statusValue = item[statusField];
        
        listItem.innerHTML = `
            <div class="list-item-avatar">
                <i class="sap-icon sap-icon--leading"></i>
            </div>
            <div class="list-item-content">
                <div class="list-item-title">${primaryValue}</div>
                <div class="list-item-subtitle">${secondaryValue}</div>
                <div class="list-item-description">${descriptionValue}</div>
            </div>
            <div class="list-item-actions">
                <div class="list-item-status">${statusValue}</div>
                <button class="list-item-button">View</button>
            </div>
        `;
        
        return listItem;
    }

    render() {
        // Re-render the list with current items
        if (this.items.length > 0) {
            // This would be called if items are dynamically updated
            const listContent = this.listElement.querySelector('.list-content');
            if (listContent) {
                listContent.innerHTML = '';
                
                this.items.forEach((item, index) => {
                    // Determine fields based on item structure
                    const fields = Object.keys(item);
                    const listItem = this.createListItem(item, fields, index);
                    listContent.appendChild(listItem);
                });
            }
        }
    }
}

// Render the complete Joule interface with list
function renderJouleInterface() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="container">
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
                            <p>New Conversation</p>
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
                                <p>List message</p>
                            </div>
                        </div>
                    </div>
                    <div class="list-component" data-name="List" data-node-id="2500:31744">
                        <!-- Header -->
                        <div class="list-header">
                            <div class="list-header-avatar">
                                <i class="sap-icon sap-icon--leading"></i>
                            </div>
                            <div class="list-header-content">
                                <div class="list-header-title-row">
                                    <div class="list-header-title">Header Title</div>
                                    <div class="list-header-count">3 of 6</div>
                                </div>
                                <div class="list-header-subtitle">This is a subtitle</div>
                                <div class="list-header-description">Add a description</div>
                            </div>
                        </div>
                        
                        <!-- List Items -->
                        <div class="list-content">
                            <div class="list-item">
                                <div class="list-item-avatar">
                                    <i class="sap-icon sap-icon--leading"></i>
                                </div>
                                <div class="list-item-content">
                                    <div class="list-item-title">Title</div>
                                    <div class="list-item-subtitle">Subtitle</div>
                                    <div class="list-item-description">This is a description that goes here</div>
                                </div>
                                <div class="list-item-actions">
                                    <div class="list-item-status">Status</div>
                                    <button class="list-item-button">Button</button>
                                </div>
                            </div>
                            
                            <div class="list-item">
                                <div class="list-item-avatar">
                                    <i class="sap-icon sap-icon--leading"></i>
                                </div>
                                <div class="list-item-content">
                                    <div class="list-item-title">Title</div>
                                    <div class="list-item-subtitle">Subtitle</div>
                                    <div class="list-item-description">This is a description that goes here</div>
                                </div>
                                <div class="list-item-actions">
                                    <div class="list-item-status">Status</div>
                                    <button class="list-item-button">Button</button>
                                </div>
                            </div>
                            
                            <div class="list-item">
                                <div class="list-item-avatar">
                                    <i class="sap-icon sap-icon--leading"></i>
                                </div>
                                <div class="list-item-content">
                                    <div class="list-item-title">Title</div>
                                    <div class="list-item-subtitle">Subtitle</div>
                                    <div class="list-item-description">This is a description that goes here</div>
                                </div>
                                <div class="list-item-actions">
                                    <div class="list-item-status">Status</div>
                                    <button class="list-item-button">Button</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="list-footer">
                            <button class="list-footer-button">Button</button>
                            <button class="list-footer-view-more">View More</button>
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
        </div>
    `;
}

// Function to initialize the interface
function initializeInterface() {
    // First render the interface
    renderJouleInterface();
    
    // Then initialize lists
    const lists = document.querySelectorAll('.list-component');
    
    lists.forEach(listElement => {
        // Create list instance and store reference
        const list = new List(listElement);
        listElement.listInstance = list;
    });
}

// Auto-initialize lists when DOM is loaded or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeInterface);
} else {
    // DOM is already loaded, initialize immediately
    initializeInterface();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = List;
}

// Global access
window.List = List;
window.renderJouleInterface = renderJouleInterface;
