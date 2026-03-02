/**
 * Carousel Component JavaScript
 * Handles carousel navigation, slide transitions, and dot indicators
 */

class Carousel {
    constructor(element) {
        this.carousel = element;
        this.currentSlide = 0;
        this.slides = [];
        this.dots = [];
        this.prevButton = null;
        this.nextButton = null;
        this.entityTypes = this.initializeEntityTypes();
        
        this.init();
    }
    
    // Initialize supported entity types with their configurations
    initializeEntityTypes() {
        return {
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
            'projects': {
                icon: 'sap-icon--project',
                title: 'Projects',
                fields: ['Project ID', 'Name', 'Manager', 'Status', 'Progress'],
                generateData: (count) => this.generateProjects(count)
            },
            'services': {
                icon: 'sap-icon--service',
                title: 'Services',
                fields: ['Service ID', 'Name', 'Category', 'Price', 'Rating'],
                generateData: (count) => this.generateServices(count)
            },
            'offers': {
                icon: 'sap-icon--offer',
                title: 'Special Offers',
                fields: ['Offer ID', 'Title', 'Discount', 'Valid Until', 'Category'],
                generateData: (count) => this.generateOffers(count)
            },
            'locations': {
                icon: 'sap-icon--map',
                title: 'Locations',
                fields: ['Location ID', 'Name', 'Address', 'Type', 'Status'],
                generateData: (count) => this.generateLocations(count)
            },
            'events': {
                icon: 'sap-icon--calendar',
                title: 'Events',
                fields: ['Event ID', 'Name', 'Date', 'Location', 'Attendees'],
                generateData: (count) => this.generateEvents(count)
            },
            'courses': {
                icon: 'sap-icon--course-book',
                title: 'Courses',
                fields: ['Course ID', 'Title', 'Instructor', 'Duration', 'Level'],
                generateData: (count) => this.generateCourses(count)
            }
        };
    }
    
    init() {
        // Find carousel elements
        this.slides = this.carousel.querySelectorAll('.carousel-item');
        this.dots = this.carousel.querySelectorAll('.carousel-dot');
        this.prevButton = this.carousel.querySelector('.carousel-nav-prev');
        this.nextButton = this.carousel.querySelector('.carousel-nav-next');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize first slide
        this.updateSlide(0);
    }
    
    setupEventListeners() {
        // Navigation buttons
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.previousSlide());
        }
        
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.nextSlide());
        }
        
        // Dot indicators
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Keyboard navigation
        this.carousel.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Touch/swipe support
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        let startX = 0;
        let endX = 0;
        
        this.carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        this.carousel.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe(startX, endX);
        });
    }
    
    handleSwipe(startX, endX) {
        const threshold = 50; // Minimum swipe distance
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide(); // Swipe left - next slide
            } else {
                this.previousSlide(); // Swipe right - previous slide
            }
        }
    }
    
    handleKeydown(e) {
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.slides.length - 1);
                break;
        }
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(nextIndex, 'next');
    }
    
    previousSlide() {
        const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex, 'prev');
    }
    
    goToSlide(index, direction = 'next') {
        if (index >= 0 && index < this.slides.length) {
            const previousIndex = this.currentSlide;
            this.currentSlide = index;
            
            // Determine direction if not provided
            if (direction === 'next' || direction === 'prev') {
                this.updateSlide(index, direction);
            } else {
                // Auto-determine direction based on index change
                const autoDirection = index > previousIndex ? 'next' : 'prev';
                this.updateSlide(index, autoDirection);
            }
        }
    }
    
    updateSlide(index, direction = 'next') {
        const previousSlide = this.currentSlide;
        
        // Remove all animation classes first
        this.slides.forEach(slide => {
            slide.classList.remove('active', 'slide-in-right', 'slide-in-left', 'slide-out-left', 'slide-out-right');
        });
        
        // Set up the transition
        if (previousSlide !== index) {
            const currentSlideElement = this.slides[previousSlide];
            const nextSlideElement = this.slides[index];
            
            if (currentSlideElement) {
                // Animate out current slide
                if (direction === 'next') {
                    currentSlideElement.classList.add('slide-out-left');
                } else {
                    currentSlideElement.classList.add('slide-out-right');
                }
            }
            
            if (nextSlideElement) {
                // Animate in next slide
                setTimeout(() => {
                    if (direction === 'next') {
                        nextSlideElement.classList.add('slide-in-right');
                    } else {
                        nextSlideElement.classList.add('slide-in-left');
                    }
                    nextSlideElement.classList.add('active');
                }, 50);
            }
        } else {
            // First load - just show the slide
            this.slides[index]?.classList.add('active');
        }
        
        // Update dot indicators with animation
        this.dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('carousel-dot-active');
                dot.classList.remove('carousel-dot');
            } else {
                dot.classList.remove('carousel-dot-active');
                dot.classList.add('carousel-dot');
            }
        });
        
        // Update button states
        this.updateButtonStates();
        
        // Emit custom event
        this.carousel.dispatchEvent(new CustomEvent('slideChanged', {
            detail: { currentSlide: index, totalSlides: this.slides.length, direction }
        }));
    }
    
    updateButtonStates() {
        // Enable/disable navigation buttons based on current position
        if (this.prevButton) {
            this.prevButton.disabled = this.currentSlide === 0;
            this.prevButton.setAttribute('aria-disabled', this.currentSlide === 0);
        }
        
        if (this.nextButton) {
            this.nextButton.disabled = this.currentSlide === this.slides.length - 1;
            this.nextButton.setAttribute('aria-disabled', this.currentSlide === this.slides.length - 1);
        }
    }
    
    // Public API methods
    getCurrentSlide() {
        return this.currentSlide;
    }
    
    getTotalSlides() {
        return this.slides.length;
    }
    
    // Auto-play functionality
    startAutoPlay(interval = 5000) {
        this.stopAutoPlay(); // Clear any existing interval
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, interval);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
    
    // Parse user request to extract entity type and count
    parseRequest(request) {
        const lowerRequest = request.toLowerCase();
        let entityType = null;
        let count = 3; // default count for carousels

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

        return { entityType, count: Math.min(count, 10) }; // Cap at 10 items for carousels
    }

    // Data generation methods for different entity types
    generateProducts(count) {
        const categories = ['Electronics', 'Office Supplies', 'Software', 'Hardware', 'Accessories'];
        const products = ['Laptop Pro', 'Monitor Ultra', 'Keyboard Elite', 'Mouse Precision', 'Printer Advanced', 'Scanner Pro', 'Tablet Max', 'Phone Premium'];
        const stockImages = [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Product ID': `PRD-${String(3000 + i).padStart(4, '0')}`,
            'Name': `${products[i % products.length]} ${String.fromCharCode(65 + (i % 26))}`,
            'Category': categories[i % categories.length],
            'Price': `$${(Math.random() * 2000 + 50).toFixed(2)}`,
            'Stock': Math.floor(Math.random() * 100),
            'Description': `High-quality ${products[i % products.length].toLowerCase()} with advanced features and excellent performance.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateCustomers(count) {
        const names = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson', 'Lisa Garcia', 'Tom Anderson', 'Maria Rodriguez'];
        const locations = ['New York', 'California', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia'];
        const statuses = ['Active', 'Premium', 'VIP', 'New', 'Inactive'];
        const stockImages = [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop&crop=face'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Customer ID': `CUST-${String(4000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Email': `${names[i % names.length].toLowerCase().replace(' ', '.')}@email.com`,
            'Location': locations[i % locations.length],
            'Status': statuses[i % statuses.length],
            'Description': `Valued customer since ${2020 + (i % 4)}. ${statuses[i % statuses.length]} member with excellent history.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateProjects(count) {
        const names = ['Website Redesign', 'Mobile App Development', 'Database Migration', 'API Integration', 'Security Audit', 'Performance Optimization', 'User Training', 'System Upgrade'];
        const managers = ['Sarah Connor', 'John Matrix', 'Ellen Ripley', 'Luke Skywalker', 'Diana Prince', 'Bruce Wayne', 'Tony Stark', 'Natasha Romanoff'];
        const statuses = ['Planning', 'In Progress', 'Testing', 'Completed', 'On Hold'];
        const stockImages = [
            'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Project ID': `PRJ-${String(8000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Manager': managers[i % managers.length],
            'Status': statuses[i % statuses.length],
            'Progress': `${Math.floor(Math.random() * 100)}%`,
            'Description': `Strategic ${names[i % names.length].toLowerCase()} project to enhance business capabilities and user experience.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateServices(count) {
        const services = ['Cloud Hosting', 'Data Analytics', 'Security Consulting', 'Software Development', 'IT Support', 'Digital Marketing', 'Training Services', 'Maintenance'];
        const categories = ['Technology', 'Consulting', 'Support', 'Development', 'Marketing'];
        const ratings = ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
        const stockImages = [
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Service ID': `SRV-${String(9000 + i).padStart(4, '0')}`,
            'Name': services[i % services.length],
            'Category': categories[i % categories.length],
            'Price': `$${(Math.random() * 500 + 50).toFixed(2)}/month`,
            'Rating': ratings[i % ratings.length],
            'Description': `Professional ${services[i % services.length].toLowerCase()} service with 24/7 support and guaranteed results.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateOffers(count) {
        const titles = ['Summer Sale', 'Black Friday Deal', 'New Year Special', 'Flash Sale', 'Weekend Offer', 'Holiday Discount', 'Clearance Sale', 'Limited Time'];
        const categories = ['Electronics', 'Software', 'Services', 'Hardware', 'Accessories'];
        const discounts = ['20%', '30%', '50%', '25%', '40%', '15%', '35%', '60%'];
        const stockImages = [
            'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Offer ID': `OFF-${String(5000 + i).padStart(4, '0')}`,
            'Title': `${titles[i % titles.length]} - ${categories[i % categories.length]}`,
            'Discount': `${discounts[i % discounts.length]} OFF`,
            'Valid Until': this.getRandomFutureDate(),
            'Category': categories[i % categories.length],
            'Description': `Don't miss this amazing ${titles[i % titles.length].toLowerCase()} with up to ${discounts[i % discounts.length]} discount!`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateLocations(count) {
        const names = ['Downtown Office', 'Tech Campus', 'Innovation Hub', 'Business Center', 'Corporate Plaza', 'Digital District', 'Commerce Park', 'Enterprise Zone'];
        const addresses = ['123 Main St', '456 Tech Ave', '789 Business Blvd', '321 Innovation Dr', '654 Corporate Way', '987 Digital St', '147 Commerce Rd', '258 Enterprise Ln'];
        const types = ['Office', 'Campus', 'Warehouse', 'Retail', 'Headquarters'];
        const statuses = ['Active', 'Opening Soon', 'Renovating', 'Fully Operational', 'Expanding'];
        const stockImages = [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Location ID': `LOC-${String(6000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Address': `${addresses[i % addresses.length]}, City ${i + 1}`,
            'Type': types[i % types.length],
            'Status': statuses[i % statuses.length],
            'Description': `Modern ${types[i % types.length].toLowerCase()} facility with state-of-the-art amenities and excellent accessibility.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateEvents(count) {
        const names = ['Tech Conference', 'Product Launch', 'Training Workshop', 'Networking Event', 'Innovation Summit', 'User Meetup', 'Demo Day', 'Awards Ceremony'];
        const locations = ['Convention Center', 'Tech Hub', 'Corporate Office', 'Hotel Ballroom', 'University Campus', 'Innovation Lab', 'Community Center', 'Online Platform'];
        const stockImages = [
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Event ID': `EVT-${String(7000 + i).padStart(4, '0')}`,
            'Name': names[i % names.length],
            'Date': this.getRandomFutureDate(),
            'Location': locations[i % locations.length],
            'Attendees': `${Math.floor(Math.random() * 500 + 50)} registered`,
            'Description': `Join us for an exciting ${names[i % names.length].toLowerCase()} featuring industry experts and networking opportunities.`,
            'Image': stockImages[i % stockImages.length]
        }));
    }

    generateCourses(count) {
        const titles = ['JavaScript Fundamentals', 'React Development', 'Node.js Backend', 'Python Data Science', 'UI/UX Design', 'Cloud Computing', 'Machine Learning', 'Cybersecurity'];
        const instructors = ['Dr. Sarah Tech', 'Prof. John Code', 'Ms. Emily Design', 'Mr. David Cloud', 'Dr. Lisa Data', 'Prof. Mike Security', 'Ms. Anna Frontend', 'Mr. Tom Backend'];
        const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels'];
        const stockImages = [
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop&crop=center'
        ];
        
        return Array.from({ length: count }, (_, i) => ({
            'Course ID': `CRS-${String(1000 + i).padStart(4, '0')}`,
            'Title': titles[i % titles.length],
            'Instructor': instructors[i % instructors.length],
            'Duration': `${Math.floor(Math.random() * 12 + 4)} weeks`,
            'Level': levels[i % levels.length],
            'Description': `Comprehensive ${titles[i % titles.length].toLowerCase()} course with hands-on projects and expert guidance.`,
            'Image': stockImages[i % stockImages.length]
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

    // Main method to generate carousel from user request
    generateFromRequest(request) {
        const { entityType, count } = this.parseRequest(request);
        
        if (!entityType || !this.entityTypes[entityType]) {
            return this.generateErrorResponse(request);
        }

        const config = this.entityTypes[entityType];
        const data = config.generateData(count);
        
        return this.renderDynamicCarousel(entityType, data, count);
    }

    generateErrorResponse(request) {
        const availableTypes = Object.keys(this.entityTypes).join(', ');
        return {
            error: true,
            message: `Could not understand request: "${request}". Available types: ${availableTypes}`
        };
    }

    renderDynamicCarousel(entityType, data, count) {
        const config = this.entityTypes[entityType];
        
        // Create carousel HTML with dynamic slides
        const carouselHTML = this.createCarouselHTML(data, config);
        
        // Update the carousel container
        this.carousel.innerHTML = carouselHTML;
        
        // Re-initialize carousel elements
        this.init();
        
        return { success: true, entityType, count, data };
    }

    createCarouselHTML(data, config) {
        const slides = data.map((item, index) => `
            <div class="carousel-item" style="display: ${index === 0 ? 'flex' : 'none'}">
                <div class="carousel-white-outer">
                    <div class="carousel-gray-container">
                        <div class="carousel-items-container">
                            <div class="carousel-item-card">
                                <div class="carousel-media">
                                    <img src="${item.Image || 'https://via.placeholder.com/300x200/0070f2/ffffff?text=Item'}" alt="${item.Name || item.Title}" class="carousel-image">
                                </div>
                                <div class="carousel-header">
                                    <div class="carousel-header-content">
                                        <div class="carousel-title-row">
                                            <div class="carousel-title">${item.Name || item.Title}</div>
                                            <div class="carousel-status">${item.Status || item.Category}</div>
                                        </div>
                                        <div class="carousel-subtitle">${item[config.fields[0]]}</div>
                                        <div class="carousel-description">${item.Description}</div>
                                    </div>
                                </div>
                                <div class="carousel-footer">
                                    <button class="carousel-button-vertical">View Details</button>
                                    <button class="carousel-button-vertical">Contact</button>
                                    <button class="carousel-button-vertical">Learn More</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const dots = data.map((_, index) => `
            <div class="carousel-dot${index === 0 ? ' carousel-dot-active' : ''}"></div>
        `).join('');

        return `
            <div class="carousel-white-outer">
                <div class="carousel-slides-container">
                    ${slides}
                </div>
                <div class="carousel-page-indicator">
                    <button class="carousel-nav-button carousel-nav-prev" title="Previous slide" aria-label="Previous slide">
                        <i class="sap-icon sap-icon--navigation-left-arrow"></i>
                    </button>
                    <div class="carousel-dots">
                        ${dots}
                    </div>
                    <button class="carousel-nav-button carousel-nav-next" title="Next slide" aria-label="Next slide">
                        <i class="sap-icon sap-icon--navigation-right-arrow"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Destroy carousel and clean up event listeners
    destroy() {
        this.stopAutoPlay();
        
        // Remove event listeners
        if (this.prevButton) {
            this.prevButton.removeEventListener('click', () => this.previousSlide());
        }
        
        if (this.nextButton) {
            this.nextButton.removeEventListener('click', () => this.nextSlide());
        }
        
        this.dots.forEach((dot, index) => {
            dot.removeEventListener('click', () => this.goToSlide(index));
        });
        
        this.carousel.removeEventListener('keydown', (e) => this.handleKeydown(e));
    }
}

// Render the complete Joule interface with carousel
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
                                <p>Carousel message</p>
                            </div>
                        </div>
                    </div>
                    <div class="carousel-component" data-name="Carousel" data-node-id="2500:24828">
                        <!-- White Outer Carousel Container -->
                        <div class="carousel-white-outer">
                            <!-- Gray Card Container Inside -->
                            <div class="carousel-gray-container">
                                <!-- Items Container -->
                                <div class="carousel-items-container">
                                    <!-- White Item Card -->
                                    <div class="carousel-item-card">
                                        <!-- Media Block -->
                                        <div class="carousel-media">
                                            <img src="${window.LIBRARY_CONFIG ? window.LIBRARY_CONFIG.getAssetUrl('3e7fecafc0c3b93c6a5073547a67b8e231cb4ffe.png') : 'http://localhost:3845/assets/3e7fecafc0c3b93c6a5073547a67b8e231cb4ffe.png'}" alt="Carousel Image" class="carousel-image">
                                        </div>
                                        
                                        <!-- Header -->
                                        <div class="carousel-header">
                                            <div class="carousel-header-content">
                                                <div class="carousel-title-row">
                                                    <div class="carousel-title">Title</div>
                                                    <div class="carousel-status">Status</div>
                                                </div>
                                                <div class="carousel-subtitle">Dolore eiusmod consectetur nisi proident</div>
                                                <div class="carousel-description">Sed esse amet incididunt veniam in anim consequat cupidatat incididunt ut incididunt consectetur. Enim</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Footer with Vertical Buttons -->
                                        <div class="carousel-footer">
                                            <button class="carousel-button-vertical">Button 1</button>
                                            <button class="carousel-button-vertical">Button 2</button>
                                            <button class="carousel-button-vertical">Button 3</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Page Indicator -->
                            <div class="carousel-page-indicator">
                                <button class="carousel-nav-button carousel-nav-prev" title="Previous slide" aria-label="Previous slide">
                                    <i class="sap-icon sap-icon--navigation-left-arrow"></i>
                                </button>
                                <div class="carousel-dots">
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot carousel-dot-active"></div>
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot"></div>
                                    <div class="carousel-dot"></div>
                                </div>
                                <button class="carousel-nav-button carousel-nav-next" title="Next slide" aria-label="Next slide">
                                    <i class="sap-icon sap-icon--navigation-right-arrow"></i>
                                </button>
                            </div>
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

// Auto-initialize function that can be called immediately or on DOM ready
function initializeCarousels() {
    // First render the interface
    renderJouleInterface();
    
    // Then initialize carousels
    const carousels = document.querySelectorAll('.carousel-component');
    
    carousels.forEach(carouselElement => {
        // Create carousel instance and store reference
        const carousel = new Carousel(carouselElement);
        carouselElement.carouselInstance = carousel;
        
        // Optional: Start auto-play (uncomment if desired)
        // carousel.startAutoPlay(5000);
    });
}

// Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCarousels);
} else {
    // DOM is already loaded, initialize immediately
    initializeCarousels();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Carousel;
}

// Global access
window.Carousel = Carousel;
