if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Ensure Firebase CDN scripts are included before firebase.js.');
  throw new Error('Firebase SDK not loaded');
}


const firebaseConfig = {
  apiKey: "AIzaSyAbc87SMNR6Rh7SN47VgGDa2Mq_xffqngg",
  authDomain: "playrush-waitlist.firebaseapp.com",
  projectId: "playrush-waitlist",
  storageBucket: "playrush-waitlist.firebasestorage.app",
  messagingSenderId: "667887125111",
  appId: "1:667887125111:web:09eff90eeaf75e9dfb7c72",
  measurementId: "G-N4T270JW6V"
};

try {
  console.log('Initializing Firebase...');
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  // Log SDK version for debugging
  console.log('Firebase SDK version:', firebase.SDK_VERSION);

  async function getWaitlistCount() {
    try {
      // Check cached count (manually updated by admin)
      const statsDoc = await db.doc('stats/waitlist').get();
      if (statsDoc.exists) {
        const data = statsDoc.data();
        const updated = data.updated?.toDate();
        const now = new Date();
        // Use cache if updated within last day
        if (updated && (now - updated) / 1000 / 60 / 60 < 24) {
          console.log('Using cached waitlist count:', data.count);
          return data.count;
        }
      }
      // Fallback: Approximate count with limit(10000)
      console.warn('Using approximate count (max 10,000 due to Spark plan limitations)');
      const snapshot = await db.collection('waitlist').limit(10000).get();
      const count = snapshot.size;
      console.log('Approximate waitlist count:', count);
      if (count === 10000 && window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast('Waitlist count may be higher than 10,000.', 'warning');
      }
      return count;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      if (window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast('Unable to fetch waitlist count.', 'error');
      }
      return 0;
    }
  }

  async function updateWaitlistCountDisplay() {
    try {
      const count = await getWaitlistCount();
      const countElements = document.querySelectorAll('.waitlist-count');
      const countContainers = document.querySelectorAll('.waitlist-counter');
      const adminCountElements = document.querySelectorAll('#adminWaitlistCount');

      // Show "10,000+" if count hits limit
      const displayCount = count === 10000 ? '10,000+' : count.toLocaleString();
      if (count >= 500) {
        countElements.forEach(element => {
          element.textContent = displayCount;
        });
        countContainers.forEach(container => {
          container.style.display = 'block';
        });
      } else {
        countContainers.forEach(container => {
          container.style.display = 'none';
        });
      }

      adminCountElements.forEach(element => {
        element.textContent = displayCount;
      });

      if (count > 18000) {
        if (window.PlayRush && window.PlayRush.showToast) {
          window.PlayRush.showToast('Waitlist growing fast—nearing daily limit!', 'warning');
        }
      }
      return count;
    } catch (error) {
      console.error('Error updating waitlist counter:', error);
      if (error.code === 'resource-exhausted' && window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast('Unable to update waitlist count due to quota limits.', 'error');
      }
      return 0;
    }
  }

  async function checkEmailExists(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const q = db.collection('waitlist').where('email', '==', normalizedEmail).limit(1);
      const snapshot = await q.get();
      const exists = !snapshot.empty;
      console.log('Email check:', normalizedEmail, exists);
      return exists;
    } catch (error) {
      console.error('Error checking email:', error);
      if (window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast('Unable to check email availability.', 'error');
      }
      return false;
    }
  }

  async function addToWaitlist(email, clientData) {
    try {
      if (clientData.honeypot) {
        throw new Error('Invalid submission detected.');
      }
      if (clientData.submitTime - clientData.formLoadTime < 5000) {
        throw new Error('Please wait a moment before submitting.');
      }

      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        throw new Error('duplicate_email');
      }

      const actionCodeSettings = {
        url: 'https://playrush.io/?verified=true',
        handleCodeInApp: true
      };

      // Retry logic for email send
      let retries = 0;
      const maxRetries = 3;
      let lastError;

      while (retries < maxRetries) {
        try {
          console.log(`Sending email link, attempt ${retries + 1}/${maxRetries}`);
          await auth.sendSignInLinkToEmail(email, actionCodeSettings);
          console.log('Email link sent successfully');
          return {
            success: true,
            message: 'Check your email to confirm your waitlist registration!'
          };
        } catch (err) {
          lastError = err;
          console.error(`Email send attempt ${retries + 1} failed:`, err.code, err.message);
          if (err.code === 'auth/quota-exceeded' && retries < maxRetries - 1) {
            retries++;
            const delay = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
            console.log(`Quota exceeded, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw err;
        }
      }

      throw lastError;
    } catch (error) {
      console.error('Error in addToWaitlist:', error);
      let message = error.message;

      switch (error.code) {
        case 'auth/quota-exceeded':
          message = 'Email verification limit reached. Please try again after 8 AM WAT tomorrow.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Please wait and try again.';
          break;
        case 'auth/invalid-action-code':
          message = 'Invalid or expired verification link.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
      }

      if (error.message === 'duplicate_email') {
        message = 'You’re already on our waitlist!';
      }

      if (window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast(message, 'error');
      }
      throw new Error(message);
    }
  }

  async function verifyAndAddToWaitlist(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return db.runTransaction(async (transaction) => {
      const q = db.collection('waitlist').where('email', '==', normalizedEmail).limit(1);
      const snapshot = await transaction.get(q);
      if (!snapshot.empty) {
        throw new Error('duplicate_email');
      }
      const newDocRef = db.collection('waitlist').doc();
      transaction.set(newDocRef, {
        email: normalizedEmail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });
      return newDocRef.id;
    }).then(async (id) => {
      console.log('Successfully added to waitlist:', normalizedEmail, 'ID:', id);
      await updateWaitlistCountDisplay();
      return true;
    }).catch((error) => {
      console.error('Error in verifyAndAddToWaitlist:', error);
      throw error;
    });
  }

  async function exportWaitlist() {
    try {
      console.log('Starting waitlist export...');
      const snapshot = await db.collection('waitlist').orderBy('timestamp', 'desc').get();
      const waitlistData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        waitlistData.push({
          email: data.email,
          timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null,
          id: doc.id
        });
      });

      const csvContent = 'Email,Timestamp,ID\n' +
        waitlistData.map(row =>
          `"${row.email}","${row.timestamp || ''}","${row.id}"`
        ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playrush_waitlist_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('Exported', waitlistData.length, 'waitlist entries');
      if (window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast(`Exported ${waitlistData.length} entries`, 'success');
      }
      return waitlistData;
    } catch (error) {
      console.error('Error exporting waitlist:', error);
      if (window.PlayRush && window.PlayRush.showToast) {
        window.PlayRush.showToast('Error exporting waitlist. Please try again.', 'error');
      }
      throw error;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    console.log('Firebase initialized, SDK version:', firebase.SDK_VERSION);
    updateWaitlistCountDisplay();
  });

  window.PlayRushWaitlist = {
    addToWaitlist,
    verifyAndAddToWaitlist,
    getWaitlistCount,
    updateWaitlistCountDisplay,
    exportWaitlist
  };

  console.log('PlayRush Waitlist initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}