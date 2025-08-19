// Performance optimization - Remove preload class
window.addEventListener('load', () => {
    document.body.classList.remove('preload');
});

// Ultra-smooth header scroll effect
let lastScrollY = 0;
const header = document.querySelector('.header');

function updateHeader() {
    const scrollY = window.pageYOffset;
    
    if (scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScrollY = scrollY;
}

// Throttled scroll handler for performance
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
        setTimeout(() => { ticking = false; }, 16);
    }
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observe all scroll-animate elements
document.querySelectorAll('.scroll-animate').forEach(el => {
    observer.observe(el);
});

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Career application modal
function openCareerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">Join PlayRush</h2>
            <p class="modal-description">
                Ready to revolutionize gaming? Send your portfolio and resume to our talent acquisition team.
            </p>
            <div class="modal-actions">
                <a href="mailto:careers@playrush.io" class="modal-email-link">
                    📧 careers@playrush.io
                </a>
                <button onclick="closeModal(this)" class="modal-close-btn">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Partnership modal
function openPartnershipModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">Partner With Us</h2>
            <p class="modal-description">
                Let's build the future of gaming together. Reach out to explore partnership opportunities.
            </p>
            <div class="modal-actions">
                <a href="mailto:partnerships@playrush.io" class="modal-email-link">
                    🤝 partnerships@playrush.io
                </a>
                <button onclick="closeModal(this)" class="modal-close-btn">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Close modal function
function closeModal(element) {
    const modal = element.closest('.modal-overlay') || element;
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// Portal tracking
document.querySelectorAll('[href*="portal.playrush.io"]').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Portal access initiated - User redirected to gaming portal');
        // Analytics tracking can be added here
    });
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Close modal on Escape key
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            closeModal(modal);
        }
    }
    
    // Quick navigation shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case '2':
                e.preventDefault();
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case '3':
                e.preventDefault();
                document.querySelector('#games')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case '4':
                e.preventDefault();
                document.querySelector('#opportunities')?.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }
});

// Performance monitoring
if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((entries) => {
        entries.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
                console.log('PlayRush.io loaded in:', entry.loadEventEnd - entry.loadEventStart, 'ms');
            }
        });
    });
    observer.observe({ entryTypes: ['navigation'] });
}

// Lazy load optimization for future content
if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                lazyImageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        lazyImageObserver.observe(img);
    });
}

// Add fade out animation to CSS
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
`;
document.head.appendChild(fadeOutStyle);

// Preload critical resources
const preloadLinks = [
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap'
];

preloadLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
});

// Error handling for failed resource loads
window.addEventListener('error', (e) => {
    console.warn('PlayRush.io: Resource failed to load:', e.target.src || e.target.href);
});

// Service Worker registration for caching (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Touch device optimizations
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Add touch-friendly styles
    const touchStyle = document.createElement('style');
    touchStyle.textContent = `
        .touch-device .btn-primary,
        .touch-device .btn-secondary,
        .touch-device .btn-opportunity {
            min-height: 48px;
            min-width: 48px;
        }
        
        .touch-device .social-link {
            min-height: 44px;
            min-width: 44px;
        }
    `;
    document.head.appendChild(touchStyle);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('PlayRush.io initialized successfully');
    
    // Add subtle entrance animations to cards
    const cards = document.querySelectorAll('.feature-card, .game-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

// Export functions for global access
window.PlayRush = {
    openCareerModal,
    openPartnershipModal,
    closeModal
};