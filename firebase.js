if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded');
  throw new Error('Firebase SDK not loaded');
}

const firebaseConfig = {
  apiKey: window.env?.FIREBASE_API_KEY,
  authDomain: window.env?.FIREBASE_AUTH_DOMAIN || 'playrushwaitlist.firebaseapp.com',
  projectId: window.env?.FIREBASE_PROJECT_ID || 'playrushwaitlist',
  storageBucket: window.env?.FIREBASE_STORAGE_BUCKET || 'playrushwaitlist.firebasestorage.app',
  messagingSenderId: window.env?.FIREBASE_MESSAGING_SENDER_ID || '422630877273',
  appId: window.env?.FIREBASE_APP_ID || '1:422630877273:web:c2dff6d221dbf823cd6948',
  measurementId: window.env?.FIREBASE_MEASUREMENT_ID || 'G-2827Y2L1T7'
};

if (!firebaseConfig.apiKey) {
  console.error('Firebase API key is missing. Set FIREBASE_API_KEY in environment variables.');
  throw new Error('Firebase API key missing');
}

try {
  const app = firebase.initializeApp(firebaseConfig);
  let analytics = null;
  if (typeof firebase.analytics === 'function') {
    analytics = firebase.analytics();
  }
  const db = firebase.firestore();
  async function addToWaitlist(email) {
    try {
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('invalid_email');
      }
      const querySnapshot = await db.collection('waitlist')
        .where('email', '==', email.trim().toLowerCase())
        .limit(1)
        .get();
      if (!querySnapshot.empty) {
        throw new Error('duplicate_email');
      }
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
  window.addToWaitlist = addToWaitlist;
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}