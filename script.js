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
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = form.querySelector('#email');
        const email = emailInput.value.trim();
        const submitBtn = form.querySelector('.newsletter-btn');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            emailInput.focus();
            return;
        }
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;
        
        try {
            if (typeof addToWaitlist === 'function') {
                const success = await addToWaitlist(email);
                if (success) {
                    showToast('Welcome to the community! Check your email for $PR updates.');
                    form.reset();
                    updateWaitlistCounter();
                }
            } else {
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
    const counterElement = document.querySelector('.waitlist-count');
    const counterContainer = document.querySelector('.waitlist-counter');
    const adminCountElement = document.getElementById('adminWaitlistCount');
    
    try {
        let count = window.playrushState.waitlistCount;
        
        if (typeof getWaitlistCount === 'function') {
            count = await getWaitlistCount();
            window.playrushState.waitlistCount = count;
        }
        
        if (count > 0) {
            if (counterElement && counterContainer) {
                counterElement.textContent = count.toLocaleString();
                counterContainer.style.display = 'block';
            }
            
            if (adminCountElement) {
                adminCountElement.textContent = count.toLocaleString();
            }
        }
    } catch (error) {
        console.error('Error updating waitlist counter:', error);
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

async function exportWaitlist() {
    if (!window.playrushState.adminMode) {
        console.warn('Admin access required');
        showToast('Admin access required', 'error');
        return;
    }
    
    try {
        if (typeof exportWaitlistData === 'function') {
            const data = await exportWaitlistData();
            
            if (data && data.length > 0) {
                const csvContent = "data:text/csv;charset=utf-8," 
                    + "Email,Date Added,Source\n"
                    + data.map(item => `${item.email},${item.dateAdded},${item.source || 'website'}`).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `playrush_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast(`Exported ${data.length} waitlist entries`);
            } else {
                showToast('No waitlist data found', 'error');
            }
        } else {
            const fallbackData = [
                { email: 'example@test.com', dateAdded: new Date().toISOString(), source: 'website' }
            ];
            
            const csvContent = "data:text/csv;charset=utf-8," 
                + "Email,Date Added,Source\n"
                + fallbackData.map(item => `${item.email},${item.dateAdded},${item.source}`).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `playrush_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Export function demo - check downloads');
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed: ' + error.message, 'error');
    }
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

window.exportWaitlist = exportWaitlist;

window.PlayRush = {
    scrollToWaitlist,
    showToast,
    trackEvent,
    enableAdminMode,
    exportWaitlist,
    toggleMobileMenu,
    closeMobileMenu
};

initEventListeners();