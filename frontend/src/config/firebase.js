import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Replace with YOUR Firebase config from Step 3
const firebaseConfig = {
  apiKey: "AIzaSyCqrHASEvZp5FhDRG3djn9VP52vKyP87a4",
  authDomain: "invoice-api-78823.firebaseapp.com",
  projectId: "invoice-api-78823",
  storageBucket: "invoice-api-78823.firebasestorage.app",
  messagingSenderId: "751893233014",
  appId: "1:751893233014:web:23a192eb9e1506c505ce57"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };