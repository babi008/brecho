import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7ow6NIQBPrSnxEunszTbbWgbuOx-p_4A",
  authDomain: "loja-a5e58.firebaseapp.com",
  projectId: "loja-a5e58",
  storageBucket: "loja-a5e58.firebasestorage.app",
  messagingSenderId: "936166270606",
  appId: "1:936166270606:web:c10066919549f3d9fc8bdf",
  measurementId: "G-YL1C5HB5ET"
};

// 🔥 INICIALIZA O APP
export const app = initializeApp(firebaseConfig);

// 🔥 INICIALIZA FIRESTORE
export const db = getFirestore(app);

// 🔥 EXPORTA STORAGE (mesmo se não usar)
export const storage = getStorage(app);

console.log("Firebase carregado, db:", db);





