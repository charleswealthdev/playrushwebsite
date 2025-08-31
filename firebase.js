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
  
  let analytics = null;
  if (typeof firebase.analytics === 'function') {
    analytics = firebase.analytics();
  } else {
    console.warn('Firebase Analytics not loaded. Skipping analytics initialization.');
  }

  const db = firebase.firestore();

  // Function to get current waitlist count
  async function getWaitlistCount() {
    try {
      const snapshot = await db.collection('waitlist').get();
      return snapshot.size;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 0;
    }
  }

  // Function to update waitlist count display
  async function updateWaitlistCountDisplay() {
    const count = await getWaitlistCount();
    const countElements = document.querySelectorAll('.waitlist-count');
    const countContainers = document.querySelectorAll('.waitlist-counter');
    
    // Only show count if >= 100 (change this threshold as needed)
    if (count >= 100) {
      countElements.forEach(element => {
        element.textContent = count.toLocaleString();
      });
      countContainers.forEach(container => {
        container.style.display = 'block';
      });
    } else {
      // Hide count display but keep for admin
      countContainers.forEach(container => {
        container.style.display = 'none';
      });
    }
    
    // Always update admin-only displays
    const adminCountElements = document.querySelectorAll('.admin-count');
    adminCountElements.forEach(element => {
      element.textContent = count.toLocaleString();
    });
    
    return count;
  }

  // Function to check if email exists (alternative approach)
  async function checkEmailExists(email) {
    try {
      // Get all emails and check in JavaScript to avoid Firebase query issues
      const snapshot = await db.collection('waitlist').get();
      const normalizedEmail = email.toLowerCase().trim();
      
      let exists = false;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase().trim() === normalizedEmail) {
          exists = true;
        }
      });
      
      return exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  // Function to add email to waitlist
  async function addToWaitlist(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if email already exists using our custom function
      const emailExists = await checkEmailExists(normalizedEmail);
      if (emailExists) {
        throw new Error('duplicate_email');
      }

      // Add email to waitlist with auto-generated ID
      const docRef = await db.collection('waitlist').add({
        email: normalizedEmail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('Successfully added to waitlist:', normalizedEmail, 'with ID:', docRef.id);
      
      // Update count display immediately
      setTimeout(() => {
        updateWaitlistCountDisplay();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
  }

  // Function to export waitlist for marketing/outreach
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
      
      // Create CSV content
      const csvContent = 'Email,Timestamp,ID\n' + 
        waitlistData.map(row => 
          `"${row.email}","${row.timestamp}","${row.id}"`
        ).join('\n');
      
      // Download CSV
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
      alert('Error exporting waitlist. Please try again.');
      throw error;
    }
  }

  // Initialize count display on page load
  document.addEventListener('DOMContentLoaded', () => {
    updateWaitlistCountDisplay();
  });

  // Expose functions to the global scope
  window.addToWaitlist = addToWaitlist;
  window.getWaitlistCount = getWaitlistCount;
  window.updateWaitlistCountDisplay = updateWaitlistCountDisplay;
  window.exportWaitlist = exportWaitlist;
  window.PlayRushWaitlist = {
    addToWaitlist,
    getWaitlistCount,
    updateWaitlistCountDisplay,
    exportWaitlist
  };
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}