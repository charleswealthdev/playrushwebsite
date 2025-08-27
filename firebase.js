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
  
  // Check if analytics is available before initializing
  let analytics = null;
  if (typeof firebase.analytics === 'function') {
    analytics = firebase.analytics();
  } else {
    console.warn('Firebase Analytics not loaded. Skipping analytics initialization.');
  }

  const db = firebase.firestore();

  // Function to add email to waitlist
  async function addToWaitlist(email) {
    try {
      // Check if email already exists in the waitlist
      const querySnapshot = await db.collection('waitlist')
        .where('email', '==', email)
        .get();
      
      if (!querySnapshot.empty) {
        // Email already exists
        throw new Error('duplicate_email');
      }

      // Add email to waitlist
      await db.collection('waitlist').add({
        email: email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Successfully added to waitlist:', email);
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
  }

  // Expose addToWaitlist to the global scope
  window.addToWaitlist = addToWaitlist;
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}