// Global state
window.playrushState = {
    bannerClosed: false,
    adminMode: false,
    waitlistCount: 0
};

// Utility functions
function scrollToWaitlist() {
    const footer = document.getElementById('waitlist');
    if (footer) {
        footer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 800);
    }
}

function closeBanner() {
    const banner = document.getElementById('topWaitlistBanner');
    if (banner) {
        banner.style.transform = 'translateY(-100%)';
        document.body.classList.remove('banner-visible');
        window.playrushState.bannerClosed = true;
        
        setTimeout(() => {
            const header = document.querySelector('.header');
            if (header) {
                header.style.top = '0';
            }
        }, 300);
    }
}

function showBanner() {
    const banner = document.getElementById('topWaitlistBanner');
    if (banner && !window.playrushState.bannerClosed) {
        setTimeout(() => {
            banner.classList.add('visible');
            document.body.classList.add('banner-visible');
        }, 2000);
    }
}

// Header scroll effects
let lastScrollY = 0;
let ticking = false;

function updateHeaderAndCta() {
    const scrollY = window.pageYOffset;
    const header = document.querySelector('.header');
    const stickyCta = document.querySelector('.sticky-cta');
    
    if (header) {
        header.classList.toggle('scrolled', scrollY > 50);
    }
    
    if (stickyCta) {
        stickyCta.classList.toggle('visible', scrollY > 300);
    }
    
    lastScrollY = scrollY;
    ticking = false;
}

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const bannerHeight = document.body.classList.contains('banner-visible') ? 70 : 0;
                const offsetTop = target.offsetTop - headerHeight - bannerHeight - 20;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Waitlist form handler
function initWaitlistForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = form.querySelector('#email');
        const email = emailInput.value.trim();
        const submitBtn = form.querySelector('.newsletter-btn');
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }
        
        // Update button state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;
        
        try {
            // Add to waitlist (assumes addToWaitlist function exists from firebase.js)
            if (typeof addToWaitlist === 'function') {
                const success = await addToWaitlist(email);
                if (success) {
                    showToast('Welcome to the community! Check your email for $PR updates.');
                    form.reset();
                    updateWaitlistCounter();
                }
            } else {
                // Fallback for when Firebase isn't available
                console.log('Email submitted:', email);
                showToast('Thanks for joining! We\'ll be in touch soon.');
                form.reset();
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            let errorMessage = 'Something went wrong. Please try again.';
            
            if (error.message === 'duplicate_email') {
                errorMessage = 'You\'re already in the community!';
            }
            
            showToast(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Toast notifications
function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, type === 'error' ? 5000 : 4000);
}

// Update waitlist counter
async function updateWaitlistCounter() {
    const counterElement = document.querySelector('.waitlist-count');
    const counterContainer = document.querySelector('.waitlist-counter');
    
    if (!counterElement || !counterContainer) return;
    
    try {
        // This would typically fetch from your backend
        // For now, we'll use a placeholder or cached value
        let count = window.playrushState.waitlistCount;
        
        if (typeof getWaitlistCount === 'function') {
            count = await getWaitlistCount();
            window.playrushState.waitlistCount = count;
        }
        
        if (count > 0) {
            counterElement.textContent = count.toLocaleString();
            counterContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('Error updating waitlist counter:', error);
    }
}

// Admin functionality
function enableAdminMode() {
    window.playrushState.adminMode = true;
    
    // Show admin elements if they exist
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = 'block';
    });
    
    showToast('Admin mode enabled');
    console.log('PlayRush admin mode activated');
}

// Performance monitoring
function initPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((entries) => {
            entries.getEntries().forEach((entry) => {
                if (entry.entryType === 'navigation') {
                    const loadTime = Math.round(entry.loadEventEnd - entry.loadEventStart);
                    console.log(`PlayRush loaded in ${loadTime}ms`);
                }
            });
        });
        observer.observe({ entryTypes: ['navigation'] });
    }
}

// Image lazy loading fallback
function initImageLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Keyboard shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Admin mode: Ctrl + Shift + A
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            enableAdminMode();
        }
        
        // Quick waitlist: Ctrl + W
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            scrollToWaitlist();
        }
    });
}

// Touch device optimizations
function initTouchOptimizations() {
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // Add touch feedback to interactive elements
        const interactiveElements = document.querySelectorAll(
            '.btn-primary, .btn-secondary, .game-card, .social-link'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('touchstart', () => {
                el.style.transform = 'scale(0.98)';
            }, { passive: true });
            
            el.addEventListener('touchend', () => {
                setTimeout(() => {
                    el.style.transform = '';
                }, 100);
            }, { passive: true });
        });
    }
}

// Event listeners
function initEventListeners() {
    // Scroll events (throttled)
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeaderAndCta);
            ticking = true;
        }
    }, { passive: true });
    
    // Page load
    window.addEventListener('load', () => {
        document.body.classList.remove('preload');
        initPerformanceMonitoring();
    });
    
    // DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('PlayRush initialized');
        
        // Initialize all components
        showBanner();
        initSmoothScrolling();
        initWaitlistForm();
        initImageLazyLoading();
        initKeyboardShortcuts();
        initTouchOptimizations();
        updateWaitlistCounter();
        
        // Set up scroll animations
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
        
        // Check for admin mode in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'playrush2025') {
            enableAdminMode();
        }
        
        // Animate elements already in view
        setTimeout(() => {
            const elementsInView = document.querySelectorAll('.scroll-animate');
            elementsInView.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('animate');
                }
            });
        }, 100);
    });
}


function trackEvent(event, data = {}) {
    console.log('Event:', event, data);
    

    if (typeof gtag !== 'undefined') {
        gtag('event', event, data);
    }
}

window.exportWaitlist = function() {
    if (!window.playrushState.adminMode) {
        console.warn('Admin access required');
        return;
    }
    
    if (typeof exportWaitlistData === 'function') {
        exportWaitlistData();
    } else {
        showToast('Export function not available', 'error');
    }
};


window.PlayRush = {
    scrollToWaitlist,
    showToast,
    trackEvent,
    enableAdminMode
};


initEventListeners();