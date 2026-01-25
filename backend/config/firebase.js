// backend/config/firebase.js
// Firebase Admin SDK initialization

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  // Check if Firebase credentials are provided
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️  Firebase credentials not found in environment variables');
    console.warn('Using emulator or limited Firebase functionality');
  }

  // Initialize with service account
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
  // Don't throw - allow app to continue (may use fallback auth)
}

module.exports = admin;
