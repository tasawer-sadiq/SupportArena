// Firebase active configuration file.
// Edit the values below to connect to your live Cloud Firestore database.
(function() {
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCAZdryNCIb1G1SsVro-pj1nhZiK5qNXhU",
  authDomain: "supportarena.firebaseapp.com",
  projectId: "supportarena",
  storageBucket: "supportarena.firebasestorage.app",
  messagingSenderId: "1046722947519",
  appId: "1:1046722947519:web:dda77d26332084ac58d90a",
  measurementId: "G-0EZRHLJHRM"
};

  window.firebaseConfig = firebaseConfig;

  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      window.db = firebase.firestore();
      window.auth = firebase.auth();
      console.log("🔥 Firebase initialized successfully.");
    } catch (e) {
      console.error("❌ Firebase initialization failed:", e);
    }
  } else {
    console.warn("⚠️ Firebase SDK not loaded in HTML. Running in local cache mode.");
  }
})();
