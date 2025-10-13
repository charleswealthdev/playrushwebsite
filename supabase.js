// ================================
// PlayRush Supabase Waitlist Script
// ================================

const SUPABASE_URL = 'https://kezhsqenliibcxucqmvz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlemhzcWVubGlpYmN4dWNxbXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTk4MjYsImV4cCI6MjA3NTc3NTgyNn0.UmrUOc1n9xBLE5cnyIEkXbTISfc9_PF9cv2ZORuh4l8';

let supabase = null;

// Global state
window.playrushState = {
  bannerClosed: false,
  adminMode: false,
  waitlistCount: 0
};

// =============================================
// Initialize Supabase
// =============================================
function initSupabase() {
  if (
    typeof window.supabase === 'undefined' ||
    typeof window.supabase.createClient === 'undefined'
  ) {
    console.error('❌ Supabase library not loaded.');
    return false;
  }

  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    return false;
  }
}

// =============================================
// Toast Notification
// =============================================
function showToast(message, type = 'success') {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  document.body.appendChild(container);

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.padding = '10px 20px';
  toast.style.marginBottom = '10px';
  toast.style.borderRadius = '4px';
  toast.style.color = '#fff';
  toast.style.background = type === 'error' ? '#e63946' : type === 'warning' ? '#f4a261' : '#2a9d8f';
  toast.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      toast.remove();
      if (!container.hasChildNodes()) container.remove();
    }, 300);
  }, type === 'error' ? 5000 : 4000);
}

// =============================================
// Smooth Scrolling & Mobile Menu
// =============================================
function scrollToWaitlist() {
  const waitlist = document.getElementById('waitlist');
  if (waitlist) {
    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
    const bannerHeight = document.body.classList.contains('banner-visible') ? 70 : 0;
    const offsetTop = waitlist.offsetTop - headerHeight - bannerHeight - 20;
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
    setTimeout(() => {
      const emailInput = document.getElementById('email');
      if (emailInput) emailInput.focus();
    }, 800);
  }
}

function toggleMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  if (hamburger && navMenu) {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
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

function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

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

// =============================================
// Banner
// =============================================
function showBanner() {
  const banner = document.getElementById('topWaitlistBanner');
  const bannerClosed = localStorage.getItem('bannerClosed');
  if (banner && bannerClosed !== 'true') {
    setTimeout(() => {
      banner.classList.add('visible');
      document.body.classList.add('banner-visible');
    }, 2000);
  }
}

function closeBanner() {
  const banner = document.getElementById('topWaitlistBanner');
  if (banner) {
    banner.style.transform = 'translateY(-100%)';
    document.body.classList.remove('banner-visible');
    window.playrushState.bannerClosed = true;
    localStorage.setItem('bannerClosed', 'true');
    setTimeout(() => {
      const header = document.querySelector('.header');
      if (header) header.style.top = '0';
    }, 300);
  }
}

// =============================================
// Waitlist Counter
// =============================================
async function getWaitlistCount() {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting waitlist count:', error);
    return 0;
  }
}

async function updateWaitlistCounter() {
  const count = await getWaitlistCount();
  window.playrushState.waitlistCount = count;
  const counter = document.querySelector('.waitlist-counter');
  const countSpan = document.querySelector('.waitlist-count');
  const adminCount = document.getElementById('adminWaitlistCount');

  if (count >= 500) {
    if (counter && countSpan) {
      countSpan.textContent = count.toLocaleString();
      counter.style.display = 'block';
    }
    if (adminCount) adminCount.textContent = count.toLocaleString();
  } else {
    if (counter) counter.style.display = 'none';
  }

  if (count > 18000) {
    showToast('Waitlist growing fast—nearing daily limit!', 'warning');
  }
}

// =============================================
// Email Verification
// =============================================
async function handleEmailVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('verified') !== 'true') return;

  const storedEmail = localStorage.getItem('waitlistEmail');
  if (!storedEmail) {
    console.error('No email found in localStorage for verification');
    showToast('Email verification failed. No email stored. Please try again.', 'error');
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError || 'No active session');
      throw new Error('Invalid or expired verification link. Please request a new link.');
    }

    const { error: insertError } = await supabase.from('waitlist').insert({
      email: storedEmail.toLowerCase().trim(),
      user_agent: navigator.userAgent,
      verified: true,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        console.warn('Duplicate email detected:', storedEmail);
        showToast("You're already on our waitlist!", 'success');
      } else {
        console.error('Database insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }
    } else {
      showToast('Welcome to PlayRush! 🎮 Redirecting to Telegram...', 'success');
    }

    localStorage.removeItem('waitlistEmail');
    await supabase.auth.signOut();

    setTimeout(() => {
      window.open('https://t.me/+Ko41EKsStoE5ZmY0', '_blank');
      window.history.replaceState({}, '', window.location.pathname);
    }, 2000);
  } catch (error) {
    console.error('Verification error:', error.message);
    showToast(error.message || 'Verification failed. Please try again.', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// =============================================
// Waitlist Submission
// =============================================
async function handleWaitlistSubmit(e) {
  e.preventDefault();

  if (!supabase) {
    showToast('Service unavailable. Please try again later.', 'error');
    return;
  }

  const form = e.target;
  const emailInput = form.querySelector('#email');
  const honeypot = form.querySelector('#honeypot')?.value.trim() || '';
  const email = emailInput.value.trim().toLowerCase();
  const submitBtn = form.querySelector('.newsletter-btn');

  if (honeypot) {
    console.warn('Bot detected via honeypot');
    showToast('Invalid submission detected.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    emailInput.focus();
    return;
  }

  const submitTime = Date.now();
  const timeElapsed = submitTime - (window.formLoadTime || 0);
  if (timeElapsed < 5000) {
    console.warn('Bot detected via timing:', timeElapsed + 'ms');
    showToast('Please wait a moment before submitting.', 'error');
    return;
  }

  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  try {
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      showToast("You're already on our waitlist!", 'success');
      emailInput.value = '';
      return;
    }

    // Force production URL in production, allow local for dev
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectBase = isDev ? window.location.origin : 'https://playrush.io';
    const redirectURL = `${redirectBase}/?verified=true`;

    console.log('🔗 Email redirect:', redirectURL);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectURL,
      },
    });

    if (otpError) {
      console.error('SMTP error:', otpError);
      if (otpError.message.includes('rate limit')) {
        showToast('Too many emails sent. Please try again later.', 'error');
      } else if (otpError.message.includes('smtp') || otpError.message.includes('authentication')) {
        showToast('Email service configuration error. Please contact support@playrush.io.', 'error');
      } else {
        throw otpError;
      }
    } else {
      localStorage.setItem('waitlistEmail', email);
      showToast('Check your email! Click the link to confirm your spot.', 'success');
      emailInput.value = '';
    }
  } catch (error) {
    console.error('Waitlist error:', error);
    showToast('Failed to join waitlist. Please try again.', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// =============================================
// Admin Panel
// =============================================
async function exportWaitlist() {
  if (!supabase || !window.playrushState.adminMode) {
    showToast('Admin access required.', 'error');
    return;
  }

  try {
    const { data, error } = await supabase.from('waitlist').select('email, created_at, verified');
    if (error) throw error;

    const csv = ['email,created_at,verified', ...data.map(row => `${row.email},${row.created_at},${row.verified}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waitlist_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Waitlist exported successfully.', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Failed to export waitlist.', 'error');
  }
}

// =============================================
// Scroll Header and Sticky CTA
// =============================================
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

// =============================================
// Intersection Observer for Animations
// =============================================
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

// =============================================
// Initialize Features
// =============================================
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

// =============================================
// PlayRushWaitlist Object
// =============================================
window.PlayRushWaitlist = {
  addToWaitlist: async (email, clientData) => {
    if (!supabase) throw new Error('Supabase not initialized');
    if (clientData.honeypot) throw new Error('Invalid submission detected');
    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingEmail) throw new Error('duplicate_email');
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectBase = isDev ? window.location.origin : 'https://playrush.io';
    const redirectURL = `${redirectBase}/?verified=true`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectURL },
    });
    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Too many emails sent');
      } else if (error.message.includes('smtp') || error.message.includes('authentication')) {
        throw new Error('Email service configuration error');
      }
      throw error;
    }
    return { message: 'Check your email! Click the link to confirm your spot.' };
  },
  verifyAndAddToWaitlist: async (email) => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) throw new Error('Invalid verification link');
    const { error: insertError } = await supabase.from('waitlist').insert({
      email: email.toLowerCase().trim(),
      user_agent: navigator.userAgent,
      verified: true,
    });
    if (insertError) {
      if (insertError.code === '23505') throw new Error('duplicate_email');
      throw insertError;
    }
    await supabase.auth.signOut();
    return { message: 'Successfully added to waitlist' };
  },
  getWaitlistCount: async () => {
    return await getWaitlistCount();
  },
  exportWaitlist: exportWaitlist
};

// =============================================
// Initialize
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 PlayRush initializing...');

  let attempts = 0;
  while (typeof window.supabase === 'undefined' && attempts < 50) {
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }

  if (!initSupabase()) {
    showToast('Failed to connect to database. Some features may not work.', 'error');
    return;
  }

  showBanner();
  initSmoothScrolling();
  initImageLazyLoading();
  initKeyboardShortcuts();
  initTouchOptimizations();
  initPerformanceMonitoring();
  updateWaitlistCounter();
  handleEmailVerification();

  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (e) => {
      const navMenu = document.getElementById('navMenu');
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        closeMobileMenu();
      }
    });
  }

  const waitlistForm = document.querySelector('.newsletter-form');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', handleWaitlistSubmit);
    window.formLoadTime = Date.now();
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeaderAndCta);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('load', () => {
    document.body.classList.remove('preload');
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });

  if (supabase) {
    supabase
      .channel('waitlist-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, updateWaitlistCounter)
      .subscribe();
  }

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

  console.log('✅ PlayRush initialized successfully');
});

window.scrollToWaitlist = scrollToWaitlist;
window.closeBanner = closeBanner;
window.PlayRush = {
  scrollToWaitlist,
  showToast,
  trackEvent: (event, data = {}) => {
    console.log('Event:', event, data);
    if (typeof gtag !== 'undefined') {
      gtag('event', event, data);
    }
  },
  enableAdminMode,
  toggleMobileMenu,
  closeMobileMenu
};