// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";
import {getAuth} from "firebase/auth"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAhaUb2wsq_BtbnAG9uDi12rx68Qr1-wUY",
  authDomain: "prajapati-investment.firebaseapp.com",
  projectId: "prajapati-investment",
  storageBucket: "prajapati-investment.firebasestorage.app",
  messagingSenderId: "1042896847391",
  appId: "1:1042896847391:web:b5f862f1f8b0db588ecb2a",
  measurementId: "G-B1M1DHMSS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export {db, storage, auth}
