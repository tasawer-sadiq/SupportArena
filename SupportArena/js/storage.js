// Storage Driver supporting local storage cache and hybrid Cloud Firestore syncing
(function() {
  const PREFIX = 'supportArena_feed:';
  let activeListeners = [];

  function isFirebaseEnabled() {
    // Active connection requires loaded Firebase SDK, initialized db, and non-placeholder API Key
    return typeof window.db !== 'undefined' && 
           window.firebaseConfig && 
           window.firebaseConfig.apiKey && 
           window.firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE' && 
           window.firebaseConfig.apiKey !== 'YOUR_API_KEY' && 
           window.firebaseConfig.apiKey !== '';
  }

  function initializeDatabase() {
    // Seed initial dummy data if local database is empty
    if (typeof window.seedDummyDatabase === 'function') {
      window.seedDummyDatabase();
    }

    // If Firebase is enabled, execute synchronization
    if (isFirebaseEnabled()) {
      syncFirebaseToLocal();
    }
  }

  // Get data helpers
  function getStoredUsers() {
    const raw = localStorage.getItem(PREFIX + 'users');
    return raw ? JSON.parse(raw) : [];
  }

  function getStoredOrgs() {
    const raw = localStorage.getItem(PREFIX + 'orgs');
    return raw ? JSON.parse(raw) : [];
  }

  function getStoredPosts() {
    const raw = localStorage.getItem(PREFIX + 'posts');
    const posts = raw ? JSON.parse(raw) : [];
    posts.forEach(p => {
      if (!p.likes) p.likes = [];
      if (!p.dislikes) p.dislikes = [];
    });
    return posts;
  }

  function getStoredReplies() {
    const raw = localStorage.getItem(PREFIX + 'replies');
    return raw ? JSON.parse(raw) : [];
  }

  function getStoredDispatches() {
    const raw = localStorage.getItem(PREFIX + 'dispatches');
    return raw ? JSON.parse(raw) : [];
  }

  function getStoredAlerts() {
    const raw = localStorage.getItem(PREFIX + 'alerts');
    return raw ? JSON.parse(raw) : [];
  }

  function getStoredNotifications() {
    const raw = localStorage.getItem(PREFIX + 'notifications');
    return raw ? JSON.parse(raw) : [];
  }

  // Save data helpers
  function saveUsers(users) {
    if (isFirebaseEnabled()) {
      const old = getStoredUsers();
      const removed = old.filter(o => !users.some(u => u.id === o.id));
      removed.forEach(r => deleteFromFirestore('users', r.id));
    }
    localStorage.setItem(PREFIX + 'users', JSON.stringify(users));
    if (isFirebaseEnabled() && users.length > 0) {
      users.forEach(u => writeToFirestore('users', u.id, u));
    }
  }

  function saveOrgs(orgs) {
    if (isFirebaseEnabled()) {
      const old = getStoredOrgs();
      const removed = old.filter(o => !orgs.some(org => org.id === o.id));
      removed.forEach(r => deleteFromFirestore('orgs', r.id));
    }
    localStorage.setItem(PREFIX + 'orgs', JSON.stringify(orgs));
    if (isFirebaseEnabled() && orgs.length > 0) {
      orgs.forEach(o => writeToFirestore('orgs', o.id, o));
    }
  }

  function savePosts(posts) {
    if (isFirebaseEnabled()) {
      const old = getStoredPosts();
      const removed = old.filter(o => !posts.some(p => p.id === o.id));
      removed.forEach(r => deleteFromFirestore('posts', r.id));
    }
    localStorage.setItem(PREFIX + 'posts', JSON.stringify(posts));
    if (isFirebaseEnabled() && posts.length > 0) {
      posts.forEach(p => writeToFirestore('posts', p.id, p));
    }
  }

  function saveReplies(replies) {
    if (isFirebaseEnabled()) {
      const old = getStoredReplies();
      const removed = old.filter(o => !replies.some(r => r.id === o.id));
      removed.forEach(r => deleteFromFirestore('replies', r.id));
    }
    localStorage.setItem(PREFIX + 'replies', JSON.stringify(replies));
    if (isFirebaseEnabled() && replies.length > 0) {
      replies.forEach(r => writeToFirestore('replies', r.id, r));
    }
  }

  function saveDispatches(dispatches) {
    if (isFirebaseEnabled()) {
      const old = getStoredDispatches();
      const removed = old.filter(o => !dispatches.some(d => d.id === o.id));
      removed.forEach(r => deleteFromFirestore('dispatches', r.id));
    }
    localStorage.setItem(PREFIX + 'dispatches', JSON.stringify(dispatches));
    if (isFirebaseEnabled() && dispatches.length > 0) {
      dispatches.forEach(d => writeToFirestore('dispatches', d.id, d));
    }
  }

  function saveAlerts(alerts) {
    if (isFirebaseEnabled()) {
      const old = getStoredAlerts();
      const removed = old.filter(o => !alerts.some(a => a.id === o.id));
      removed.forEach(r => deleteFromFirestore('alerts', r.id));
    }
    localStorage.setItem(PREFIX + 'alerts', JSON.stringify(alerts));
    if (isFirebaseEnabled() && alerts.length > 0) {
      alerts.forEach(a => writeToFirestore('alerts', a.id, a));
    }
  }

  function saveNotifications(notifications) {
    if (isFirebaseEnabled()) {
      const old = getStoredNotifications();
      const removed = old.filter(o => !notifications.some(n => n.id === o.id));
      removed.forEach(r => deleteFromFirestore('notifications', r.id));
    }
    localStorage.setItem(PREFIX + 'notifications', JSON.stringify(notifications));
    if (isFirebaseEnabled() && notifications.length > 0) {
      notifications.forEach(n => writeToFirestore('notifications', n.id, n));
    }
  }

  // Firestore specific read/write operations
  async function writeToFirestore(collection, id, data) {
    if (!isFirebaseEnabled()) return;
    try {
      const docData = { ...data };
      delete docData.id; // Prevent redundant id in Firestore payload
      await window.db.collection(collection).doc(id).set(docData);
      console.log(`🔥 Written to Firestore: ${collection}/${id}`);
    } catch (e) {
      console.error(`❌ Firestore write failed: ${collection}/${id}`, e);
    }
  }

  async function deleteFromFirestore(collection, id) {
    if (!isFirebaseEnabled()) return;
    try {
      await window.db.collection(collection).doc(id).delete();
      console.log(`🔥 Deleted from Firestore: ${collection}/${id}`);
    } catch (e) {
      console.error(`❌ Firestore delete failed: ${collection}/${id}`, e);
    }
  }

  function syncFirebaseToLocal() {
    if (!isFirebaseEnabled()) return;
    console.log("🔄 Checking Firestore database state for sync...");
    
    // Unsubscribe from any active listeners first to avoid duplicates
    if (activeListeners.length > 0) {
      activeListeners.forEach(unsub => {
        try { unsub(); } catch (err) {}
      });
      activeListeners = [];
    }

    // Check and seed each collection individually if empty in Firestore
    const collections = ['users', 'orgs', 'posts', 'replies', 'dispatches', 'alerts', 'notifications'];
    const checkPromises = collections.map(async (coll) => {
      try {
        const snap = await window.db.collection(coll).limit(1).get();
        if (snap.empty) {
          console.log(`📤 Firestore collection ${coll} is empty. Seeding defaults...`);
          const localData = JSON.parse(localStorage.getItem(PREFIX + coll)) || [];
          for (const item of localData) {
            const docData = { ...item };
            delete docData.id;
            await window.db.collection(coll).doc(item.id).set(docData);
          }
        }
      } catch (err) {
        console.error(`❌ Firestore collection check/seed failed for ${coll}:`, err);
      }
    });

    Promise.all(checkPromises).then(() => {
      console.log("📥 Firestore verified. Setting up real-time sync listeners...");
      setupRealTimeListeners();
    }).catch(e => {
      console.error("❌ Firestore initial check failed:", e);
      setupRealTimeListeners();
    });
  }

  function setupRealTimeListeners() {
    const collections = ['users', 'orgs', 'posts', 'replies', 'dispatches', 'alerts', 'notifications'];
    collections.forEach(coll => {
      try {
        const unsub = window.db.collection(coll).onSnapshot(snapshot => {
          const data = [];
          snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
          });
          localStorage.setItem(PREFIX + coll, JSON.stringify(data));
          console.log(`📥 [Firestore Real-Time] Synced: ${coll} (${data.length} items)`);
          
          // Trigger UI refresh in dashboard page
          document.dispatchEvent(new CustomEvent('refresh-feed'));
        }, err => {
          console.error(`❌ Firestore real-time listener error for ${coll}:`, err);
        });
        activeListeners.push(unsub);
      } catch (err) {
        console.error(`❌ Failed to attach real-time listener for ${coll}:`, err);
      }
    });
  }

  // Account Deletion Helper
  async function deleteUserAccount(userId, role, email) {
    console.log(`🗑️ Deleting user account: ${userId} (${role}), ${email}`);
    
    // 1. Remove from local storage
    if (role === 'organization') {
      const orgs = getStoredOrgs().filter(o => o.id !== userId);
      saveOrgs(orgs);
    } else {
      const users = getStoredUsers().filter(u => u.id !== userId);
      saveUsers(users);
    }
    
    // 2. Remove from Firebase Firestore & Auth
    if (isFirebaseEnabled()) {
      try {
        const collectionName = role === 'organization' ? 'orgs' : 'users';
        await deleteFromFirestore(collectionName, userId);
        
        // Also delete from Firebase Auth if the credentials match
        const firebaseUser = window.auth.currentUser;
        if (firebaseUser && firebaseUser.email === email) {
          await firebaseUser.delete();
          console.log("🔥 Deleted user from Firebase Auth.");
        }
      } catch (err) {
        console.error("❌ Error deleting account from Firebase:", err);
      }
    }
  }

  // Expose storage functions globally
  window.initializeDatabase = initializeDatabase;
  window.isFirebaseEnabled = isFirebaseEnabled;
  
  window.getStoredUsers = getStoredUsers;
  window.getStoredOrgs = getStoredOrgs;
  window.getStoredPosts = getStoredPosts;
  window.getStoredReplies = getStoredReplies;
  window.getStoredDispatches = getStoredDispatches;
  window.getStoredAlerts = getStoredAlerts;
  window.getStoredNotifications = getStoredNotifications;

  window.saveUsers = saveUsers;
  window.saveOrgs = saveOrgs;
  window.savePosts = savePosts;
  window.saveReplies = saveReplies;
  window.saveDispatches = saveDispatches;
  window.saveAlerts = saveAlerts;
  window.saveNotifications = saveNotifications;
  
  window.deleteFromFirestore = deleteFromFirestore;
  window.deleteUserAccount = deleteUserAccount;
})();
