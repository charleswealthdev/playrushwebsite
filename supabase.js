const SUPABASE_URL = 'https://kezhsqenliibcxucqmvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlemhzcWVubGlpYmN4dWNxbXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxOTk4MjYsImV4cCI6MjA3NTc3NTgyNn0.UmrUOc1n9xBLE5cnyIEkXbTISfc9_PF9cv2ZORuh4l8';

let supabase = null;

// Global state
window.playrushState = {
  bannerClosed: false,
  adminMode: false,
  waitlistCount: 0
};

// Initialize Supabase
async function initSupabase() {
  if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient === 'undefined') {
    console.error('❌ Supabase library not loaded.');
    showToast('Service unavailable. Please try again later.', 'error');
    return false;
  }

  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    showToast('Failed to connect to database. Contact support@playrush.io.', 'error');
    return false;
  }
}

// Toast Notification
function showToast(message, type = 'success') {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  document.body.appendChild(container);

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
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

// Smooth Scrolling & Mobile Menu
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

// Banner
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

// Waitlist Counter
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
    showToast('Failed to fetch waitlist count. Contact support@playrush.io.', 'error');
    return 0;
  }
}

async function updateWaitlistCounter() {
  const count = await getWaitlistCount();
  window.playrushState.waitlistCount = count;
  const counter = document.querySelector('.waitlist-counter');
  const countSpan = document.querySelector('.waitlist-count');
  const adminCount = document.getElementById('adminWaitlistCount');

  if (count > 0) {
    if (counter && countSpan) {
      countSpan.textContent = count.toLocaleString() + '+';
      counter.style.display = 'block';
    }
    if (adminCount) adminCount.textContent = count.toLocaleString();
  } else {
    if (counter) counter.style.display = 'none';
  }

  if (count > 18000) {
    showToast('Waitlist growing fast—nearing capacity! Join now!', 'warning');
  }
}

// Email Verification
async function handleEmailVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('verified') !== 'true') return;

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user) {
      console.error('Session error:', sessionError || 'No active session');
      showToast('Invalid or expired verification link. Please request a new link.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      console.error('No email found in session');
      showToast('Email verification failed. No email found. Please try again.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    const { data: existingEmail } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', userEmail.toLowerCase().trim())
      .maybeSingle();

    if (existingEmail) {
      showToast("You're already on our waitlist! Join our Telegram community.", 'success');
      await supabase.auth.signOut();
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        window.open('https://t.me/+JXjfc9bgieo5NTU0', '_blank');
      }, 1500);
      return;
    }

    const { error: insertError } = await supabase.from('waitlist').insert({
      email: userEmail.toLowerCase().trim(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString().split('.')[0]
    });

    if (insertError) {
      if (insertError.code === '23505') {
        console.warn('Duplicate email detected:', userEmail);
        showToast("You're already on our waitlist! Join our Telegram community.", 'success');
      } else {
        console.error('Database insert error:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }
    } else {
      showToast('Welcome to PlayRush! 🎮 Redirecting to Telegram in 2s...', 'success');
    }

    await supabase.auth.signOut();
    window.history.replaceState({}, '', window.location.pathname);

    setTimeout(() => {
      window.open('https://t.me/+JXjfc9bgieo5NTU0', '_blank');
    }, 2000);
  } catch (error) {
    console.error('Verification error:', error.message);
    showToast(error.message || 'Verification failed. Contact support@playrush.io.', 'error');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

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
      showToast("You're already on our waitlist! Join our Telegram community.", 'success');
      emailInput.value = '';
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      setTimeout(() => {
        window.open('https://t.me/+JXjfc9bgieo5NTU0', '_blank');
      }, 1500);
      return;
    }

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
        showToast('Too many emails sent. Please try again later or contact support@playrush.io.', 'error');
      } else if (otpError.message.includes('smtp') || otpError.message.includes('authentication')) {
        showToast('Email service error. Please contact support@playrush.io.', 'error');
      } else {
        throw otpError;
      }
    } else {
      showToast('Check your email! Click the link to confirm your spot.', 'success');
      emailInput.value = '';
    }
  } catch (error) {
    console.error('Waitlist error:', error);
    showToast('Failed to join waitlist. Contact support@playrush.io.', 'error');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}


async function exportWaitlist() {
  if (!supabase || !window.playrushState.adminMode) {
    showToast('Admin access required.', 'error');
    return;
  }

  try {
    const { data, error } = await supabase.from('waitlist').select('email, timestamp, id, user_agent');
    if (error) throw error;

    const csv = ['email,timestamp,id,user_agent', ...data.map(row => `${row.email},${row.timestamp},${row.id},${row.user_agent || ''}`)].join('\n');
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
    showToast('Failed to export waitlist. Contact support@playrush.io.', 'error');
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

function enableAdminMode() {
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) {
    window.playrushState.adminMode = true;
    adminPanel.style.display = 'block';
    showToast('Admin mode enabled', 'success');
  }
}

function initTouchOptimizations() {
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    const interactiveElements = document.querySelectorAll(
      '.btn-primary, .btn-secondary, .nav-link, .social-link, .footer-link'
    );
    interactiveElements.forEach(el => {
      el.addEventListener('touchstart', () => {
        el.classList.add('touch-active');
      });
      el.addEventListener('touchend', () => {
        setTimeout(() => {
          el.classList.remove('touch-active');
        }, 150);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (initSupabase()) {
    handleEmailVerification();
    updateWaitlistCounter();
    setInterval(updateWaitlistCounter, 60000);
  }

  initSmoothScrolling();
  initImageLazyLoading();
  initKeyboardShortcuts();
  initTouchOptimizations();
  showBanner();

  window.formLoadTime = Date.now();

  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', handleWaitlistSubmit);
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeaderAndCta);
      ticking = true;
    }
  });

  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }

  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
  });

  window.PlayRushWaitlist = {
    exportWaitlist
  };

  document.body.classList.remove('preload');
});