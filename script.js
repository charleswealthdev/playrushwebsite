function enableAdminMode() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = 'inline-flex';
    });
    
    // Using variable instead of sessionStorage for artifact compatibility
    window.playrushAdminMode = true;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'Admin mode enabled';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function scrollToWaitlist() {
    const footer = document.getElementById('contact');
    if (footer) {
        // Smooth scroll with enhanced timing
        footer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Enhanced focus with visual feedback
        setTimeout(() => {
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
                // Add highlight effect
                emailInput.style.transform = 'scale(1.05)';
                emailInput.style.boxShadow = '0 0 25px rgba(255, 0, 110, 0.6)';
                setTimeout(() => {
                    emailInput.style.transform = '';
                    emailInput.style.boxShadow = '';
                }, 1000);
            }
        }, 1000);
    }
}

function closeBanner() {
    const banner = document.getElementById('topWaitlistBanner');
    if (banner) {
        banner.style.transform = 'translateY(-100%)';
        document.body.classList.remove('banner-visible');
        
        // Using variable instead of sessionStorage for artifact compatibility
        window.bannerClosed = true;
        
        // Adjust header position smoothly
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
    if (banner && !window.bannerClosed) {
        setTimeout(() => {
            banner.classList.add('visible');
            document.body.classList.add('banner-visible');
            
            // Add enhanced entrance animation
            banner.style.animation = 'bannerSlideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 1500); // Reduced delay for better UX
    }
}

// Enhanced page load animations
window.addEventListener('load', () => {
    document.body.classList.remove('preload');
    
    // Enhanced CTA animation
    const cta = document.querySelector('.cta-pulse');
    if (cta) {
        cta.classList.add('animate');
        setTimeout(() => {
            cta.style.animation = 'ctaPulse 3s infinite ease-in-out';
        }, 2000);
    }
    
    // Enhanced newsletter button animation
    const newsletterBtn = document.querySelector('.newsletter-btn');
    if (newsletterBtn) {
        newsletterBtn.classList.add('animate-bounce');
        setTimeout(() => newsletterBtn.classList.remove('animate-bounce'), 4000);
    }
    
    // Animate hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add('animate');
        }, 500);
    }
});

// Enhanced scroll handling
let lastScrollY = 0;
let ticking = false;

function updateHeaderAndCta() {
    const scrollY = window.pageYOffset;
    const header = document.querySelector('.header');
    const stickyCta = document.querySelector('.sticky-cta');
    
    if (header) {
        header.classList.toggle('scrolled', scrollY > 100);
    }
    
    if (stickyCta) {
        stickyCta.classList.toggle('visible', scrollY > 400);
    }
    
    lastScrollY = scrollY;
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateHeaderAndCta);
        ticking = true;
    }
});

// Enhanced intersection observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Staggered animation delay
            setTimeout(() => {
                entry.target.classList.add('animate');
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, { 
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

// Enhanced smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const bannerHeight = document.body.classList.contains('banner-visible') ? 80 : 0;
            const offsetTop = target.offsetTop - headerHeight - bannerHeight - 20;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

function openCareerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'career-modal-title');
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title" id="career-modal-title">Join PlayRush</h2>
            <p class="modal-description">Passionate about games? Bring your creativity to our team! We need artists, storytellers, and community builders to create amazing gaming experiences.</p>
            <div class="modal-actions">
                <a href="mailto:careers@playrush.io" class="modal-email-link">📧 careers@playrush.io</a>
                <button onclick="closeModal(this)" class="modal-close-btn" aria-label="Close modal">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    modal.querySelector('.modal-content').focus();
}

function openPartnershipModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'partnership-modal-title');
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title" id="partnership-modal-title">Partner With Us</h2>
            <p class="modal-description">Have epic ideas? Let's team up to create unforgettable gaming adventures and build the future of interactive entertainment!</p>
            <div class="modal-actions">
                <a href="mailto:partnerships@playrush.io" class="modal-email-link">🤝 partnerships@playrush.io</a>
                <button onclick="closeModal(this)" class="modal-close-btn" aria-label="Close modal">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
    modal.querySelector('.modal-content').focus();
}

function closeModal(modal) {
    if (modal.closest) {
        modal = modal.closest('.modal-overlay');
    }
    modal.style.animation = 'fadeOut 0.4s ease';
    setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 400);
}

// Enhanced countdown with better visual feedback
function startGameCountdown() {
    const countdown = document.getElementById('countdown-timer');
    if (!countdown) return;
    
    const launchDate = new Date('2025-12-01T00:00:00Z').getTime();
    let interval;
    
    function updateTimer() {
        const now = new Date().getTime();
        const distance = launchDate - now;
        
        if (distance < 0) {
            countdown.innerHTML = '<span class="timer-unit live-indicator">🎉 We are Live! Jump In! 🎉</span>';
            clearInterval(interval);
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
        
        // Add pulse animation to seconds for visual appeal
        if (secondsEl && seconds % 2 === 0) {
            secondsEl.parentElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                if (secondsEl.parentElement) {
                    secondsEl.parentElement.style.transform = '';
                }
            }, 200);
        }
    }
    
    updateTimer();
    interval = setInterval(updateTimer, 1000);
}

// Enhanced click tracking
document.querySelectorAll('[href*="portal.playrush.io"]').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Portal access initiated', {
            cta: link.textContent || link.className,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
    });
});

document.querySelectorAll('.token-cta').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Token waitlist click', {
            cta: link.textContent,
            timestamp: new Date().toISOString(),
            scrollPosition: window.pageYOffset
        });
    });
});

// Enhanced newsletter form with better validation and feedback
document.querySelector('.newsletter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('#email');
    const email = emailInput.value.trim();
    const submitBtn = form.querySelector('.newsletter-btn');
    
    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address!', 'error');
        emailInput.focus();
        emailInput.style.borderColor = '#f44336';
        setTimeout(() => {
            emailInput.style.borderColor = '';
        }, 2000);
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Joining...';
    submitBtn.disabled = true;
    
    try {
        // Use the Firebase waitlist function
        const success = await addToWaitlist(email);
        
        if (success) {
            showToast('You\'ve Leveled Up! Stay tuned for updates!', 'success');
            form.reset();
            
            // Enhanced success animation
            emailInput.style.borderColor = '#4caf50';
            setTimeout(() => {
                emailInput.style.borderColor = '';
            }, 3000);
        }
    } catch (error) {
        console.error('Waitlist error:', error);
        let errorMessage = 'Oops, something went wrong. Try again!';
        
        if (error.message === 'duplicate_email') {
            errorMessage = 'This email is already on the waitlist!';
        } else if (error.message === 'invalid_email') {
            errorMessage = 'Please check your email format!';
        }
        
        showToast(errorMessage, 'error');
    } finally {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Enhanced toast function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Enhanced toast styling
    toast.style.animation = 'toastSlideIn 0.4s ease';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, type === 'error' ? 4000 : 3000);
}

// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modal with Escape
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) closeModal(modal);
    }
    
    // Admin mode shortcut
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        enableAdminMode();
    }
    
    // Quick waitlist access with Ctrl+W
    if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        scrollToWaitlist();
    }
});

// Performance monitoring
if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((entries) => {
        entries.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
                console.log('PlayRush.io loaded in:', Math.round(entry.loadEventEnd - entry.loadEventStart), 'ms');
            }
        });
    });
    observer.observe({ entryTypes: ['navigation'] });
}

// Enhanced lazy loading with better fallbacks
if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src || '/assets/placeholder.jpg';
                
                // Enhanced loading with fade-in effect
                img.style.opacity = '0';
                img.src = src;
                
                img.onload = () => {
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '1';
                    img.classList.remove('lazy');
                };
                
                img.onerror = () => {
                    img.src = '/assets/placeholder.jpg';
                    img.style.opacity = '0.7';
                };
                
                lazyImageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    
    document.querySelectorAll('img[data-src]').forEach(img => lazyImageObserver.observe(img));
}

// Touch device detection and optimization
if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    // Enhance touch interactions
    document.querySelectorAll('.btn-primary, .btn-secondary, .feature-card, .game-card').forEach(el => {
        el.addEventListener('touchstart', () => {
            el.style.transform = 'scale(0.98)';
        });
        
        el.addEventListener('touchend', () => {
            setTimeout(() => {
                el.style.transform = '';
            }, 150);
        });
    });
}

// Enhanced DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('PlayRush.io initialized successfully');
    
    // Start countdown
    startGameCountdown();
    
    // Show banner with enhanced timing
    showBanner();
    
    // Check for admin mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'playrush2025') {
        enableAdminMode();
    }
    
    // Restore admin mode if previously enabled
    if (window.playrushAdminMode) {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = 'inline-flex';
        });
    }
    
    // Enhanced preload removal with staggered animations
    setTimeout(() => {
        document.body.classList.add('loaded');
        
        // Trigger scroll animations for elements in viewport
        const elementsInView = document.querySelectorAll('.scroll-animate');
        elementsInView.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                setTimeout(() => {
                    el.classList.add('animate');
                }, index * 100);
            }
        });
    }, 100);
    
    // Add enhanced hover effects for interactive elements
    document.querySelectorAll('.feature-card, .game-card, .opportunity-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = card.classList.contains('game-card') ? 
                'scale(1.08) translateY(-8px)' : 
                'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
});

// Global PlayRush object for external access
window.PlayRush = {
    openCareerModal,
    openPartnershipModal,
    closeModal,
    scrollToWaitlist,
    showToast
};

// Legacy admin function
window.enablePlayRushAdmin = enableAdminMode;