
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6TX9BCXS0jzIyufXe3AabptVAGUjmqMY",
  authDomain: "interviewai-237e4.firebaseapp.com",
  projectId: "interviewai-237e4",
  storageBucket: "interviewai-237e4.firebasestorage.app",
  messagingSenderId: "142764509115",
  appId: "1:142764509115:web:ed5da7b53c8becf7efa69e",
  measurementId: "G-DX7B9CYETQ"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
