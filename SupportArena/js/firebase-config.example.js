// Firebase configuration example template.
// Duplicate this file as 'firebase-config.js' and fill in your details to connect to Firebase.
(function() {
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // To enable online firestore sync:
  // 1. Uncomment the lines below.
  // 2. Add Firebase JS SDK scripts in index.html.
  
  /*
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    console.log("🔥 Firebase initialized successfully.");
  } else {
    console.warn("⚠️ Firebase SDK not loaded in HTML. Running in local cache mode.");
  }
  */
})();
