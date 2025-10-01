if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Ensure Firebase CDN scripts are included before firebase.js.');
  throw new Error('Firebase SDK not loaded');
}

const firebaseConfig = {
  apiKey: "AIzaSyBDRh0-RzscjEtDdK_8U0wAgH_9J1GS284",
  authDomain: "playrushwaitlist.firebaseapp.com",
  projectId: "playrushwaitlist",
  storageBucket: "playrushwaitlist.firebasestorage.app",
  messagingSenderId: "422630877273",
  appId: "1:422630877273:web:c2dff6d221dbf823cd6948",
  measurementId: "G-2827Y2L1T7"
};

try {
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();

  async function getWaitlistCount() {
    try {
      const snapshot = await db.collection('waitlist').get();
      return snapshot.size;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  }

  async function updateWaitlistCountDisplay() {
    try {
      const count = await getWaitlistCount();
      const countElements = document.querySelectorAll('.waitlist-count');
      const countContainers = document.querySelectorAll('.waitlist-counter');
      const adminCountElements = document.querySelectorAll('#adminWaitlistCount');

      if (count >= 500) {
        countElements.forEach(element => {
          element.textContent = count.toLocaleString();
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
        element.textContent = count.toLocaleString();
      });

      if (count > 18000) {
        window.PlayRush.showToast('Waitlist growing fast—nearing daily limit!', 'warning');
      }

      return count;
    } catch (error) {
      console.error('Error updating waitlist counter:', error);
      if (error.code === 'resource-exhausted') {
        window.PlayRush.showToast('Unable to update waitlist count due to quota limits.', 'error');
      }
      return 0;
    }
  }

  async function checkEmailExists(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const query = await db.collection('waitlist')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get();
      return !query.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  async function addToWaitlist(email, clientData) {
    try {
      // Honeypot check
      if (clientData.honeypot) {
        throw new Error('Invalid submission detected.');
      }

      // Time throttling
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
      await auth.sendSignInLinkToEmail(email, actionCodeSettings);
      return { success: true, message: 'Check your email to confirm your waitlist registration!' };
    } catch (error) {
      console.error('Error in addToWaitlist:', error);
      let message = error.message;
      if (error.code === 'resource-exhausted') {
        message = 'Our waitlist is unavailable, please try again tomorrow!';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts—please try again later.';
      }
      throw new Error(message);
    }
  }

  async function verifyAndAddToWaitlist(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const emailExists = await checkEmailExists(normalizedEmail);
      if (emailExists) {
        throw new Error('duplicate_email');
      }

      const docRef = await db.collection('waitlist').add({
        email: normalizedEmail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent
      });

      console.log('Successfully added to waitlist:', normalizedEmail, 'ID:', docRef.id);
      await updateWaitlistCountDisplay();
      return true;
    } catch (error) {
      console.error('Error in verifyAndAddToWaitlist:', error);
      throw error;
    }
  }

  async function exportWaitlist() {
    try {
      const snapshot = await db.collection('waitlist')
        .orderBy('timestamp', 'desc')
        .get();
      
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
          `"${row.email}","${row.timestamp}","${row.id}"`
        ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `playrush_waitlist_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('Exported', waitlistData.length, 'waitlist entries');
      return waitlistData;
    } catch (error) {
      console.error('Error exporting waitlist:', error);
      window.PlayRush.showToast('Error exporting waitlist. Please try again.', 'error');
      throw error;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateWaitlistCountDisplay();
  });

  window.PlayRushWaitlist = {
    addToWaitlist,
    verifyAndAddToWaitlist,
    getWaitlistCount,
    updateWaitlistCountDisplay,
    exportWaitlist
  };
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}