window.playrushState = {
    bannerClosed: false,
    adminMode: false,
    waitlistCount: 0
};

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

function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

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

function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                closeMobileMenu();
                
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

function initWaitlistForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) {
        console.error('Newsletter form not found');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Honeypot check
        const honeypot = form.querySelector('#honeypot')?.value.trim();
        if (honeypot && honeypot !== '') {
            console.warn('Bot detected via honeypot');
            showToast('Invalid submission detected.', 'error');
            return;
        }
        
        const emailInput = form.querySelector('#email');
        const email = emailInput.value.trim();
        const submitBtn = form.querySelector('.newsletter-btn');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address.', 'error');
            emailInput.focus();
            return;
        }
        
        // Time-based throttling
        const submitTime = Date.now();
        const timeElapsed = submitTime - (window.formLoadTime || 0);
        if (timeElapsed < 5000) {
            console.warn('Bot detected via timing:', timeElapsed + 'ms');
            showToast('Please wait a moment before submitting.', 'error');
            return;
        }
        
        // reCAPTCHA v3
        let recaptchaToken = '';
        try {
            if (typeof grecaptcha !== 'undefined') {
                recaptchaToken = await grecaptcha.execute('6LcGJdorAAAAACUzhoNqCmPmZUEaKwMFq7jMYTWf', { action: 'waitlist_signup' });
            } else {
                console.warn('reCAPTCHA not loaded');
                showToast('Security check unavailable—please try again.', 'error');
                return;
            }
        } catch (error) {
            console.error('reCAPTCHA error:', error);
            showToast('Security check failed—please try again.', 'error');
            return;
        }
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;
        
        let shouldRedirect = false;
        
        try {
            if (typeof window.PlayRushWaitlist?.addToWaitlist === 'function') {
                console.log('Calling addToWaitlist with email:', email);
                const clientData = {
                    honeypot: honeypot || '',
                    submitTime: submitTime,
                    formLoadTime: window.formLoadTime || 0,
                    recaptchaToken: recaptchaToken
                };
                const success = await window.PlayRushWaitlist.addToWaitlist(email, clientData);
                if (success) {
                    console.log('Waitlist join successful');
                    showToast('Welcome to the PlayRush community! Joining Telegram...');
                    form.reset();
                    await updateWaitlistCounter();
                    shouldRedirect = true;
                } else {
                    console.warn('addToWaitlist returned false');
                    showToast('Unable to join waitlist—please try again.', 'error');
                }
            } else {
                console.warn('addToWaitlist not available');
                showToast('Unable to connect to our database—please try again later.', 'error');
            }
        } catch (error) {
            console.error('Waitlist error:', error);
            let errorMessage = 'Something went wrong—please try again.';
            
            if (error.message === 'duplicate_email') {
                errorMessage = 'You’re already on our waitlist!';
            } else if (error.message.includes('full today')) {
                errorMessage = error.message;
            } else if (error.message.includes('Invalid submission') || error.message.includes('Security check')) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        
        if (shouldRedirect) {
            setTimeout(() => {
                console.log('Redirecting to Telegram...');
                window.open('https://t.me/+JXjfc9bgieo5NTU0', '_blank');
            }, 2000);
        }
    });
}

function showToast(message, type = 'success') {
    document.querySelectorAll('.toast').forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, type === 'error' ? 5000 : 4000);
}

async function updateWaitlistCounter() {
    try {
        let count = 0;
        if (typeof window.PlayRushWaitlist?.getWaitlistCount === 'function') {
            count = await window.PlayRushWaitlist.getWaitlistCount();
            window.playrushState.waitlistCount = count;
        }
        const counterElement = document.querySelector('.waitlist-count');
        const counterContainer = document.querySelector('.waitlist-counter');
        const adminCountElement = document.getElementById('adminWaitlistCount');
        if (count > 0) {
            if (counterElement && counterContainer) {
                counterElement.textContent = count.toLocaleString();
                counterContainer.style.display = 'block';
            }
            if (adminCountElement) {
                adminCountElement.textContent = count.toLocaleString();
            }
        } else {
            if (counterContainer) {
                counterContainer.style.display = 'none';
            }
        }
        // Warn if nearing write quota (20K daily on Spark plan)
        if (count > 18000) {
            showToast('Waitlist growing fast—nearing daily limit!', 'warning');
        }
    } catch (error) {
        console.error('Error updating waitlist counter:', error);
        if (error.code === 'resource-exhausted') {
            window.playrushState.waitlistCount = 0;
            const counterContainer = document.querySelector('.waitlist-counter');
            if (counterContainer) {
                counterContainer.style.display = 'none';
            }
            showToast('Unable to update waitlist count due to quota limits.', 'error');
        }
    }
}

function enableAdminMode() {
    window.playrushState.adminMode = true;
    
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = 'block';
    });
    
    showToast('Admin mode enabled');
    console.log('PlayRush admin mode activated');
    updateWaitlistCounter();
}

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

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            enableAdminMode();
        }
        
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            scrollToWaitlist();
        }
        
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
}

function initTouchOptimizations() {
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
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

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', toggleMobileMenu);
        
        navMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-link')) {
                closeMobileMenu();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                if (navMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            }
        });
    }
}

function initEventListeners() {
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeaderAndCta);
            ticking = true;
        }
    }, { passive: true });
    
    window.addEventListener('load', () => {
        document.body.classList.remove('preload');
        initPerformanceMonitoring();
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('PlayRush initialized');
        window.formLoadTime = Date.now(); 
        
        showBanner();
        initSmoothScrolling();
        initWaitlistForm();
        initImageLazyLoading();
        initKeyboardShortcuts();
        initTouchOptimizations();
        initMobileMenu();
        updateWaitlistCounter();
        
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'playrush2025') {
            enableAdminMode();
        }
        
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

window.PlayRush = {
    scrollToWaitlist,
    showToast,
    trackEvent,
    enableAdminMode,
    toggleMobileMenu,
    closeMobileMenu
};

initEventListeners();