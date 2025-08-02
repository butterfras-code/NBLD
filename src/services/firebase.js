import firebase from 'firebase/app';
import 'firebase/firestore';

// --- Firebase Configuration ---
// DO NOT MODIFY THESE. They are provided by the Canvas environment.
const firebaseConfig = {
    apiKey: "AIzaSyBKmzMtCnEWIFEiq6WK6f1E4JTCkC2tnt0",
    authDomain: "neonbootsdjapp.firebaseapp.com",
    projectId: "neonbootsdjapp",
    storageBucket: "neonbootsdjapp.appspot.com",
    messagingSenderId: "916767461225",
    appId: "1:916767461225:web:aa07f19c1719cba8d837f8",
    measurementId: "G-P1KDRD91W3"
};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


// --- Initialize Firebase (Compat Syntax) ---
let app;
let db;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (error) {
    console.error("Firebase initialization error. Please provide your Firebase config.", error);
}

export { db, app, appId };
