// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Ensure Firebase CDN scripts are included before firebase.js.');
  throw new Error('Firebase SDK not loaded');
}

// Firebase configuration using global env variables (injected via index.html or Vercel)
const firebaseConfig = {
  apiKey: window.env?.FIREBASE_API_KEY || 'AIzaSyBDRh0-RzscjEtDdK_8U0wAgH_9J1GS284',
  authDomain: window.env?.FIREBASE_AUTH_DOMAIN || 'playrushwaitlist.firebaseapp.com',
  projectId: window.env?.FIREBASE_PROJECT_ID || 'playrushwaitlist',
  storageBucket: window.env?.FIREBASE_STORAGE_BUCKET || 'playrushwaitlist.firebasestorage.app',
  messagingSenderId: window.env?.FIREBASE_MESSAGING_SENDER_ID || '422630877273',
  appId: window.env?.FIREBASE_APP_ID || '1:422630877273:web:c2dff6d221dbf823cd6948',
  measurementId: window.env?.FIREBASE_MEASUREMENT_ID || 'G-2827Y2L1T7'
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'AIzaSyBDRh0-RzscjEtDdK_8U0wAgH_9J1GS284') {
  console.error('Firebase API key is missing or invalid. Please set FIREBASE_API_KEY in environment variables.');
  throw new Error('Firebase API key is missing');
}

// Initialize Firebase
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
      // Validate email format
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('invalid_email');
      }

      // Check for duplicate email
      const querySnapshot = await db.collection('waitlist')
        .where('email', '==', email.trim().toLowerCase())
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        throw new Error('duplicate_email');
      }

      // Add email to waitlist
      const docRef = await db.collection('waitlist').add({
        email: email.trim().toLowerCase(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Successfully added to waitlist:', email, 'Document ID:', docRef.id);
      return true;
    } catch (error) {
      console.error('Error adding to waitlist:', error.message);
      throw error;
    }
  }

  // Expose addToWaitlist to the global scope
  window.addToWaitlist = addToWaitlist;
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}