// Authentication manager for SupportArena (Direct Access version, OTP Bypassed)
(function() {

  async function handleLogin() {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
      alert('Please fill in both Email and Password fields.');
      return;
    }

    // Double submit prevention
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = 'Signing In...';
    }

    try {
      // Firebase Auth login if active
      if (window.isFirebaseEnabled()) {
        try {
          await window.auth.signInWithEmailAndPassword(email, password);
          console.log("🔥 Logged in via Firebase Auth.");
        } catch (e) {
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            console.log("⚡ Checking local mock credentials...");
          } else {
            alert("Firebase Login Error: " + e.message);
            if (loginButton) {
              loginButton.disabled = false;
              loginButton.textContent = 'Sign In';
            }
            return;
          }
        }
      }

      // Retrieve user details from stored collections
      let user = window.getStoredUsers().find(u => u.email === email && u.password === password);
      if (!user) {
        user = window.getStoredOrgs().find(o => o.email === email && o.password === password);
      }

      if (!user) {
        alert('Invalid credentials. Select a Quick Access account below or register.');
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = 'Sign In';
        }
        return;
      }

      // Auto-register demo accounts in Firebase Auth in the background if enabled
      if (window.isFirebaseEnabled() && window.auth.currentUser === null) {
        try {
          await window.auth.createUserWithEmailAndPassword(email, password);
          console.log(`⚡ Auto-registered ${email} in Firebase Auth.`);
        } catch (err) {
          // If already exists or other error, just proceed
        }
      }

      // Direct redirect to Dashboard (OTP Bypassed!)
      window.showDashboard(user);

    } catch (err) {
      alert("Authentication Error: " + err.message);
    } finally {
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = 'Sign In';
      }
    }
  }

  async function handleSignup(onSuccessCallback) {
    const signupRoleCitizen = document.getElementById('signup-role-citizen');
    const isCitizen = signupRoleCitizen && signupRoleCitizen.classList.contains('active');

    let name, username, email, password;
    if (isCitizen) {
      const nameEl = document.getElementById('signup-name');
      const emailEl = document.getElementById('signup-email');
      const passEl = document.getElementById('signup-password');

      name = nameEl ? nameEl.value.trim() : '';
      email = emailEl ? emailEl.value.trim() : '';
      password = passEl ? passEl.value : '';
      username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    } else {
      const nameEl = document.getElementById('signup-org-name');
      const emailEl = document.getElementById('signup-org-email');
      const passEl = document.getElementById('signup-org-password');

      name = nameEl ? nameEl.value.trim() : '';
      email = emailEl ? emailEl.value.trim() : '';
      password = passEl ? passEl.value : '';
      username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    }
    const signupButton = document.getElementById('signup-button');

    if (!name || !email || !password) {
      alert('Please fill out all standard fields.');
      return;
    }

    if (name.length < 2) {
      alert('Name must be at least 2 characters.');
      return;
    }
    if (!email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    // Double submit prevention
    if (signupButton) {
      signupButton.disabled = true;
      signupButton.textContent = 'Creating Account...';
    }

    try {
      // Register in Firebase Auth if active
      if (window.isFirebaseEnabled()) {
        try {
          await window.auth.createUserWithEmailAndPassword(email, password);
          console.log("🔥 Registered in Firebase Auth.");
        } catch (e) {
          if (e.code === 'auth/email-already-in-use') {
            console.warn("⚠️ Email already in Firebase Auth. Linking to existing account.");
          } else {
            alert("Firebase Registration Error: " + e.message);
            if (signupButton) {
              signupButton.disabled = false;
              signupButton.textContent = 'Create Account';
            }
            return;
          }
        }
      }

      let newUser = null;

      if (isCitizen) {
        newUser = {
          id: 'citizen-' + Date.now(),
          name: name,
          username: username || 'citizen_' + Date.now().toString().slice(-4),
          email: email,
          password: password,
          role: 'citizen',
          location: 'Downtown'
        };

        const users = window.getStoredUsers();
        if (users.some(u => u.email === email || u.username === username)) {
          alert('Email or Username already exists.');
          if (signupButton) {
            signupButton.disabled = false;
            signupButton.textContent = 'Create Account';
          }
          return;
        }
        users.push(newUser);
        window.saveUsers(users);
      } else {
        newUser = {
          id: 'org-' + Date.now(),
          name: name,
          username: username || 'org_' + Date.now().toString().slice(-4),
          email: email,
          password: password,
          role: 'organization',
          type: 'NGO',
          area: 'All Sectors'
        };

        const orgs = window.getStoredOrgs();
        if (orgs.some(o => o.email === email || o.username === username)) {
          alert('Email or Username already exists.');
          if (signupButton) {
            signupButton.disabled = false;
            signupButton.textContent = 'Create Account';
          }
          return;
        }
        orgs.push(newUser);
        window.saveOrgs(orgs);
      }

      // Clear input fields
      const safeClear = (id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      };
      safeClear('signup-name');
      safeClear('signup-email');
      safeClear('signup-password');
      safeClear('signup-org-name');
      safeClear('signup-org-email');
      safeClear('signup-org-password');

      // Direct redirect to dashboard (OTP Bypassed!)
      if (typeof onSuccessCallback === 'function') {
        onSuccessCallback(newUser);
      } else if (typeof window.showDashboard === 'function') {
        window.showDashboard(newUser);
      }

    } catch (err) {
      alert("Registration Error: " + err.message);
    } finally {
      if (signupButton) {
        signupButton.disabled = false;
        signupButton.textContent = 'Create Account';
      }
    }
  }

  // Register Quick Access logins
  window.addEventListener('DOMContentLoaded', () => {
    const setupQuickAccessBtn = (btnId, email) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            let user = window.getStoredUsers().find(u => u.email === email);
            if (!user) user = window.getStoredOrgs().find(o => o.email === email);

            if (user) {
              if (window.isFirebaseEnabled()) {
                try {
                  await window.auth.signInWithEmailAndPassword(user.email, user.password);
                  console.log("🔥 Quick signed-in to Firebase Auth.");
                } catch (e) {
                  if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                    // Create in Auth if not existing yet
                    try {
                      await window.auth.createUserWithEmailAndPassword(user.email, user.password);
                    } catch (err) {}
                  }
                }
              }
              window.showDashboard(user);
            }
          } catch (e) {
            console.error("Quick Access error:", e);
          } finally {
            btn.disabled = false;
          }
        });
      }
    };

    // Admin
    setupQuickAccessBtn('quick-admin', 'admin@example.com');
    // Citizens
    setupQuickAccessBtn('quick-user1', 'ahmad@example.com');
    setupQuickAccessBtn('quick-user2', 'sara@example.com');
    setupQuickAccessBtn('quick-user3', 'usman@example.com');
    // Organizations
    setupQuickAccessBtn('quick-org1', 'wapda@service.local');
    setupQuickAccessBtn('quick-org2', 'rescue1122@service.local');
  });

  // Expose functions globally
  window.handleLogin = handleLogin;
  window.handleSignup = handleSignup;
})();
