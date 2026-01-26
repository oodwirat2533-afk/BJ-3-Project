import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2NFRQqYfvElIWusSCDVgP9yZQTRWsv0g",
  authDomain: "bj-3-exam.firebaseapp.com",
  projectId: "bj-3-exam",
  storageBucket: "bj-3-exam.firebasestorage.app",
  messagingSenderId: "100429597069",
  appId: "1:100429597069:web:05b2baacbf080be47155c4",
  measurementId: "G-50GGWM7TEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Optional: Analytics

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
