// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2cTI-esBWCUzJlcGlB9FAtAk4z2Y_Rog",
  authDomain: "islanderscricketclub.firebaseapp.com",
  databaseURL: "https://islanderscricketclub-default-rtdb.firebaseio.com",
  projectId: "islanderscricketclub",
  storageBucket: "islanderscricketclub.firebasestorage.app",
  messagingSenderId: "417469597245",
  appId: "1:417469597245:web:90a1b1238d33ef218f4c54",
  measurementId: "G-TVQZCZ1QG2"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Export auth and other services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

// Enable offline persistence for better offline support
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not available in this browser');
    }
  });