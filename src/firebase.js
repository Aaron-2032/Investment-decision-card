// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPWQabI71Rg74V78ba54vkiq3oxFicPxA",
  authDomain: "investment-decision-card.firebaseapp.com",
  projectId: "investment-decision-card",
  storageBucket: "investment-decision-card.firebasestorage.app",
  messagingSenderId: "399830559907",
  appId: "1:399830559907:web:b1c92a4e81b514e6506316",
  measurementId: "G-Y6BS10J7GQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);