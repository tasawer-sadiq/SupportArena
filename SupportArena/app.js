// Central entry point coordinator for SupportArena (Redesigned Slate theme version)

window.currentUser = null;

// Expose AI criticality scoring logic
function analyzeAICriticality(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  
  const criticalKeywords = ['fire', 'explosion', 'sparking', 'immediate danger', 'injury', 'collapsed', 'flooding', 'toxic', 'poison', 'gas leak', 'electrocution', 'wires sparking'];
  const highKeywords = ['broken', 'leak', 'outage', 'accident', 'robbery', 'crime', 'blockage', 'hole', 'pothole', 'dark', 'smell', 'unsafe', 'smog', 'air pollution', 'gas shortage', 'pressure drop'];
  const mediumKeywords = ['garbage', 'litter', 'trash', 'odor', 'noise', 'dust', 'park', 'renovation', 'overflowing'];

  const matchedCrit = criticalKeywords.some(kw => text.includes(kw));
  const matchedHigh = highKeywords.some(kw => text.includes(kw));
  const matchedMed = mediumKeywords.some(kw => text.includes(kw));

  if (matchedCrit) return 'Critical';
  if (matchedHigh) return 'High';
  if (matchedMed) return 'Medium';
  return 'Low';
}

function showDashboard(user) {
  window.currentUser = user;
  
  // Persist session across refreshes
  sessionStorage.setItem('supportArena_session', JSON.stringify({ id: user.id }));
  localStorage.setItem('supportArena_session', JSON.stringify({ id: user.id }));
  document.documentElement.classList.add('user-logged-in');
  
  // Redirect to role-specific dashboard page
  if (user.role === 'citizen') {
    window.location.href = 'dashboard-citizen.html';
  } else if (user.role === 'organization') {
    window.location.href = 'dashboard-org.html';
  } else if (user.role === 'admin') {
    window.location.href = 'dashboard-admin.html';
  }
  return;
  
  // Hide landing page, hide auth card, show app shell and dashboard
  const landingSection = document.getElementById('landing-section');
  const authSection = document.getElementById('auth-section');
  const appShell = document.getElementById('app-shell-container');
  const dashboard = document.getElementById('dashboard');

  if (landingSection) landingSection.classList.add('hidden');
  if (authSection) authSection.classList.add('hidden');
  if (appShell) appShell.classList.remove('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
  
  // Set avatar initials for composer trigger avatar
  const composerAvatar = document.getElementById('composer-avatar-init');
  if (composerAvatar && user.name) {
    composerAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  // Update navbar role badge
  const appRoleLabel = document.getElementById('app-role-label');
  if (appRoleLabel) {
    const roleText = user.role === 'admin' ? 'Admin' : user.role === 'citizen' ? 'Citizen' : 'Organization';
    appRoleLabel.textContent = user.name + ' (' + roleText + ')';
  }

  // Composer visibility: only Citizens and Admins can author reports
  const composerCard = document.getElementById('composer-card');
  if (composerCard) {
    if (user.role === 'citizen' || user.role === 'admin') {
      composerCard.classList.remove('hidden');
    } else {
      composerCard.classList.add('hidden');
    }
  }

  // Clear composer inputs
  document.getElementById('post-title').value = '';
  document.getElementById('post-desc').value = '';
  document.getElementById('post-location').value = '';
  document.getElementById('post-category').selectedIndex = 0;
  window.resetComposerMedia();
  
  const triggerContainer = document.getElementById('composer-trigger-container');
  const formContainer = document.getElementById('composer-form');
  if (triggerContainer) triggerContainer.classList.remove('hidden');
  if (formContainer) formContainer.classList.add('hidden');

  // Render dashboard components
  refreshDashboard();
}

function refreshDashboard() {
  if (!currentUser) return;

  // Render profile card
  window.renderProfileCard(
    currentUser, 
    (updatedUser) => {
      window.currentUser = updatedUser;
      showDashboard(window.currentUser);
    },
    (userId) => {
      // Citizen "View My Posts" click toggles filter on/off
      const currentFilter = window.getActivePriorityFilter ? window.getActivePriorityFilter() : 'All';
      if (window.activeTimelineUserId === userId) {
        window.filterTimelineByUserId(null); // Clear filter
      } else {
        window.filterTimelineByUserId(userId); // Filter by own posts
      }
      window.renderFeed(currentUser);
    }
  );

  // Render critical alerts banner
  window.renderUpcomingAlertBanner(currentUser, () => {
    refreshDashboard();
  });

  // Render posts feed
  window.renderFeed(currentUser);

  // Render sidebar status panels
  const filter = window.getActivePriorityFilter ? window.getActivePriorityFilter() : 'All';
  window.renderDashboardPanels(currentUser, filter);
}

// Dynamic Database connection status indicators update
function updateDBStatusIndicators() {
  const isEnabled = typeof window.isFirebaseEnabled === 'function' && window.isFirebaseEnabled();
  const statusBadges = ['landing-db-status', 'header-db-status', 'auth-db-status'];
  
  statusBadges.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isEnabled) {
        el.textContent = '🟢 Firebase Connected';
        el.className = 'db-status-badge connected';
        el.title = 'SupportArena is actively syncing with online Cloud Firestore Database.';
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });
}

// Global logout action
function logout() {
  window.currentUser = null;
  sessionStorage.removeItem('supportArena_session');
  localStorage.removeItem('supportArena_session');
  document.documentElement.classList.remove('user-logged-in');
  
  // Sign out from Firebase if configured
  if (window.auth && typeof window.auth.signOut === 'function') {
    window.auth.signOut().catch(err => {
      console.warn("⚠️ Firebase Auth SignOut failed: ", err);
    });
  }

  // Redirect to index.html if we are on the dashboard page
  if (document.getElementById('dashboard')) {
    window.location.href = 'index.html';
    return;
  }

  // Transitions: show landing page, hide auth card, hide dashboard shell
  const landingSection = document.getElementById('landing-section');
  const authSection = document.getElementById('auth-section');
  const appShell = document.getElementById('app-shell-container');
  const dashboard = document.getElementById('dashboard');

  if (landingSection) landingSection.classList.remove('hidden');
  if (authSection) authSection.classList.add('hidden');
  if (appShell) appShell.classList.add('hidden');
  if (dashboard) dashboard.classList.add('hidden');
  
  const appRoleLabel = document.getElementById('app-role-label');
  if (appRoleLabel) appRoleLabel.textContent = 'Guest';
  
  // Clear inputs defensively
  const safeClear = (id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  };
  safeClear('login-email');
  safeClear('login-password');
  safeClear('signup-name');
  safeClear('signup-username');
  safeClear('signup-email');
  safeClear('signup-password');
  safeClear('signup-org-name');
  safeClear('signup-org-area');
  
  const existingToast = document.getElementById('otp-toast');
  if (existingToast) existingToast.remove();
}

// Theme handling
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const authThemeToggleBtn = document.getElementById('auth-theme-toggle-btn');
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark'; // Dark is NOT default, light is!
  
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  const handleToggle = () => {
    document.body.classList.toggle('dark-mode');
    const currentDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', currentDark ? 'dark' : 'light');
  };

  if (themeToggleBtn) themeToggleBtn.addEventListener('click', handleToggle);
  if (authThemeToggleBtn) authThemeToggleBtn.addEventListener('click', handleToggle);
}

function updateThemeIcon(isLight) {
  // SVG handles transition automatically via CSS body.light-mode class!
}

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  window.initializeDatabase();
  initTheme();
  
  // Set database connection status indicators
  updateDBStatusIndicators();
  
  // Check and restore session persistence before page rendering
  if (typeof window.isFirebaseEnabled === 'function' && window.isFirebaseEnabled()) {
    window.auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        console.log("🔥 Firebase Auth session detected:", firebaseUser.email);
        let user = window.getStoredUsers().find(u => u.email === firebaseUser.email);
        if (!user) user = window.getStoredOrgs().find(o => o.email === firebaseUser.email);
        if (user) {
          showDashboard(user);
        }
      } else {
        sessionStorage.removeItem('supportArena_session');
        localStorage.removeItem('supportArena_session');
        if (document.getElementById('dashboard')) {
          window.location.href = 'index.html';
        }
      }
    });
  } else {
    const session = sessionStorage.getItem('supportArena_session') || localStorage.getItem('supportArena_session');
    let authenticated = false;
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        let user = window.getStoredUsers().find(u => u.id === sessionData.id);
        if (!user) user = window.getStoredOrgs().find(o => o.id === sessionData.id);
        if (user) {
          showDashboard(user);
          authenticated = true;
        }
      } catch (e) {
        sessionStorage.removeItem('supportArena_session');
        localStorage.removeItem('supportArena_session');
      }
    }
    if (!authenticated && document.getElementById('dashboard')) {
      window.location.href = 'index.html';
    }
  }
  
  // Connect Event Listeners
  
  // Auth tabs switches
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  if (loginTab && signupTab && loginForm && signupForm) {
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    });
    
    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });
  }

  // Signup Citizen/Organization toggle
  const signupRoleCitizen = document.getElementById('signup-role-citizen');
  const signupRoleOrg = document.getElementById('signup-role-org');
  const orgFields = document.getElementById('signup-org-fields');
  const citizenFields = document.getElementById('citizen-signup-fields');

  if (signupRoleCitizen && signupRoleOrg && orgFields) {
    signupRoleCitizen.addEventListener('click', () => {
      signupRoleCitizen.classList.add('active');
      signupRoleOrg.classList.remove('active');
      orgFields.classList.add('hidden');
      if (citizenFields) citizenFields.classList.remove('hidden');
    });

    signupRoleOrg.addEventListener('click', () => {
      signupRoleOrg.classList.add('active');
      signupRoleCitizen.classList.remove('active');
      orgFields.classList.remove('hidden');
      if (citizenFields) citizenFields.classList.add('hidden');
    });
  }

  // Transitions between Landing Page and Auth Card (Redirecting to standalone pages)
  const landingLoginBtn = document.getElementById('landing-login-btn');
  const landingSignupBtn = document.getElementById('landing-signup-btn');
  const landingReportIssueBtn = document.getElementById('landing-report-issue-btn');
  const backToLandingBtn = document.getElementById('back-to-landing-btn');

  if (landingLoginBtn) landingLoginBtn.addEventListener('click', () => window.location.href = 'login.html');
  if (landingSignupBtn) landingSignupBtn.addEventListener('click', () => window.location.href = 'signup.html');
  if (landingReportIssueBtn) landingReportIssueBtn.addEventListener('click', () => window.location.href = 'login.html');

  if (backToLandingBtn) {
    backToLandingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }

  // Clear notifications click event
  const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', () => {
      if (currentUser) {
        window.clearAllCitizenNotifications(currentUser);
      }
    });
  }

  // Logo home click event
  const logoHome = document.getElementById('header-logo-home');
  if (logoHome) {
    logoHome.addEventListener('click', () => {
      if (currentUser) {
        window.filterTimelineByUserId(null);
        refreshDashboard();
      }
    });
  }

  // Action button clicks inside auth (Guarded for standalone pages)
  const loginButton = document.getElementById('login-button');
  const signupButton = document.getElementById('signup-button');
  if (loginButton) loginButton.addEventListener('click', window.handleLogin);
  if (signupButton) signupButton.addEventListener('click', () => window.handleSignup(showDashboard));

  // Composer event handlers
  const composerTrigger = document.getElementById('composer-trigger');
  const composerTriggerContainer = document.getElementById('composer-trigger-container');
  const composerForm = document.getElementById('composer-form');
  const composerCancelBtn = document.getElementById('composer-cancel-btn');
  const composerSubmitBtn = document.getElementById('composer-submit-btn');

  if (composerTrigger && composerForm && composerCancelBtn) {
    composerTrigger.addEventListener('click', () => {
      composerTriggerContainer.classList.add('hidden');
      composerForm.classList.remove('hidden');
    });
    
    composerCancelBtn.addEventListener('click', () => {
      composerTriggerContainer.classList.remove('hidden');
      composerForm.classList.add('hidden');
      window.resetComposerMedia();
    });
  }

  if (composerSubmitBtn) {
    composerSubmitBtn.addEventListener('click', () => {
      window.submitNewPost(currentUser, () => {
        composerTriggerContainer.classList.remove('hidden');
        composerForm.classList.add('hidden');
        refreshDashboard();
      });
    });
  }

  // Media Attachment inputs
  const mediaInput = document.getElementById('composer-media-input');
  if (mediaInput) {
    mediaInput.addEventListener('change', window.handleComposerMediaUpload);
  }

  // Initialize severity sidebar filters
  window.renderAdminPriorityFilters(() => {
    window.renderFeed(currentUser);
    window.renderDashboardPanels(currentUser, window.getActivePriorityFilter());
  });

  // Custom document events
  document.addEventListener('refresh-feed', () => {
    refreshDashboard();
  });

  document.addEventListener('app-logout', () => {
    logout();
  });

  // Trigger login on Enter keypress (Guarded for standalone pages)
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  if (loginEmail) loginEmail.addEventListener('keypress', e => { if (e.key === 'Enter') window.handleLogin(); });
  if (loginPassword) loginPassword.addEventListener('keypress', e => { if (e.key === 'Enter') window.handleLogin(); });
});

// Expose globally
window.analyzeAICriticality = analyzeAICriticality;
window.showDashboard = showDashboard;
window.updateDBStatusIndicators = updateDBStatusIndicators;
window.refreshDashboard = refreshDashboard;
