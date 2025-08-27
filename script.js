window.addEventListener('load', () => {
    document.body.classList.remove('preload');
    const cta = document.querySelector('.cta-pulse');
    if (cta) {
        cta.classList.add('animate');
        setTimeout(() => cta.classList.remove('animate'), 2000);
    }
    const newsletterBtn = document.querySelector('.newsletter-btn');
    if (newsletterBtn) {
        newsletterBtn.classList.add('animate-bounce');
        setTimeout(() => newsletterBtn.classList.remove('animate-bounce'), 3000);
    }
});

let lastScrollY = 0;
const header = document.querySelector('.header');
const stickyCta = document.querySelector('.sticky-cta');

function updateHeaderAndCta() {
    const scrollY = window.pageYOffset;
    header.classList.toggle('scrolled', scrollY > 80);
    stickyCta.classList.toggle('visible', scrollY > 300);
    lastScrollY = scrollY;
}

window.addEventListener('scroll', () => {
    requestAnimationFrame(updateHeaderAndCta);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <p class="modal-description">Passionate about games? Bring your creativity to our team! We need artists, storytellers, and community builders.</p>
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
            <p class="modal-description">Have epic ideas? Let’s team up to create unforgettable gaming adventures!</p>
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
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 300);
}

function startGameCountdown() {
    const countdown = document.getElementById('countdown-timer');
    if (!countdown) return;
    const launchDate = new Date('2025-12-01T00:00:00Z').getTime();
    let interval;
    function updateTimer() {
        const now = new Date().getTime();
        const distance = launchDate - now;
        if (distance < 0) {
            countdown.innerHTML = '<span class="timer-unit">We’re Live! Jump In!</span>';
            clearInterval(interval);
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    updateTimer();
    interval = setInterval(updateTimer, 1000);
}

document.querySelectorAll('[href*="portal.playrush.io"]').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Portal access initiated', {
            cta: link.textContent || link.className,
            timestamp: new Date().toISOString()
        });
    });
});

document.querySelectorAll('.token-cta').forEach(link => {
    link.addEventListener('click', () => {
        console.log('Token waitlist click', {
            cta: link.textContent,
            timestamp: new Date().toISOString()
        });
    });
});

document.querySelector('.newsletter-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('#email').value;
  try {
    const success = await addToWaitlist(email);
    if (success) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = 'You’ve Leveled Up! Stay tuned for updates!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      e.target.reset();
    }
  } catch (error) {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    if (error.message === 'duplicate_email') {
      toast.textContent = 'This email is already on the waitlist!';
    } else {
      toast.textContent = 'Oops, something went wrong. Try again!';
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) closeModal(modal);
    }
});

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

if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || '/assets/placeholder.jpg';
                img.classList.remove('lazy');
                lazyImageObserver.unobserve(img);
            }
        });
    });
    document.querySelectorAll('img[data-src]').forEach(img => lazyImageObserver.observe(img));
}

if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('PlayRush.io initialized successfully');
    startGameCountdown();
});

window.PlayRush = {
    openCareerModal,
    openPartnershipModal,
    closeModal
};