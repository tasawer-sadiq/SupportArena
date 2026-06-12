// Admin Dashboard Coordinator for SupportArena
(function() {
  let currentUser = null;
  let activeTimelineUserId = null;
  let activeSeverityFilter = 'Critical'; // Default to Critical Issues
  const expandedPosts = new Set();
  let expandedDispatchPostId = null; // Target post ID for the Dispatch Task card

  // Theme Management
  function initTheme() {
    const btn = document.getElementById('theme-toggle-btn');
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark'; // Light is default!
    
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    if (btn) {
      btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
      });
    }
  }

  // Session Validation
  function checkSession() {
    const session = sessionStorage.getItem('supportArena_session') || localStorage.getItem('supportArena_session');
    if (!session) {
      window.location.href = 'index.html';
      return;
    }
    try {
      const data = JSON.parse(session);
      let user = window.getStoredUsers().find(u => u.id === data.id);
      
      if (!user || user.id !== 'admin-1') {
        // Redirect if citizen or organization
        const org = window.getStoredOrgs().find(o => o.id === data.id);
        if (org) {
          window.location.href = 'dashboard-org.html';
          return;
        }
        const citizen = window.getStoredUsers().find(u => u.id === data.id);
        if (citizen) {
          window.location.href = 'dashboard-citizen.html';
          return;
        }
        
        sessionStorage.removeItem('supportArena_session');
        localStorage.removeItem('supportArena_session');
        window.location.href = 'index.html';
        return;
      }
      
      currentUser = user;
      initializeDashboard();
    } catch (e) {
      sessionStorage.removeItem('supportArena_session');
      localStorage.removeItem('supportArena_session');
      window.location.href = 'index.html';
    }
  }

  // Logout function
  async function logout() {
    sessionStorage.removeItem('supportArena_session');
    localStorage.removeItem('supportArena_session');
    
    if (window.isFirebaseEnabled() && window.auth && typeof window.auth.signOut === 'function') {
      try {
        await window.auth.signOut();
        console.log("🔥 Signed out of Firebase Auth.");
      } catch (err) {
        console.error("❌ Firebase signout failed: ", err);
      }
    }
    
    window.location.href = 'index.html';
  }

  // Initialize Page Component
  function initializeDashboard() {
    const appRoleLabel = document.getElementById('app-role-label');
    if (appRoleLabel) {
      appRoleLabel.textContent = currentUser.name + ' (Admin)';
    }

    setupHeaderEvents();
    initSeverityNav();
    setupDispatchFormEvents();
    
    // Clear notifications click
    const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
    if (clearNotificationsBtn) {
      clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Initial Render
    refreshDashboard();
  }

  function refreshDashboard() {
    renderProfileCard(currentUser, false);
    renderFeed();
    renderAICriticalIncidentQueue();
    renderActiveHelpDispatches();
    syncSeverityCounts();
    renderDispatchTaskCard();
    renderNotificationsPanel();
    renderUpcomingAlertBanner();
  }

  // Render Upcoming Critical Alerts Banner
  function renderUpcomingAlertBanner() {
    const container = document.getElementById('alert-banner-container');
    if (!container) return;

    const alerts = window.getStoredAlerts();
    if (alerts.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    const alertItem = alerts[0];
    
    container.innerHTML = `
      <div class="alert-banner ${alertItem.criticality.toLowerCase()}" style="margin-bottom: 20px; border-radius:8px; padding: 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: var(--text); display: flex; align-items: center; justify-content: space-between;">
        <div class="alert-content">
          <span class="alert-badge" style="background: var(--danger); font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight:700; margin-right: 8px;">⚡ MONSOON & URBAN ALERTS</span>
          <strong>${alertItem.criticality.toUpperCase()} FORECAST:</strong> ${alertItem.desc}
        </div>
      </div>
    `;
  }

  // Initialize Left Sidebar AI Severity Queue Filter
  function initSeverityNav() {
    const items = document.querySelectorAll('.severity-sidebar-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        items.forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeSeverityFilter = e.currentTarget.getAttribute('data-priority');
        
        // Re-render only right sidebar AI Critical Incident Queue
        renderAICriticalIncidentQueue();
      });
    });
  }

  // Sync count badges in the left sidebar severity queues card
  function syncSeverityCounts() {
    const posts = window.getStoredPosts();
    const dispatches = window.getStoredDispatches();

    const getActivePostCount = (pList) => {
      return pList.filter(p => !dispatches.some(d => d.postId === p.id && d.status === 'Resolved')).length;
    };

    const elCrit = document.getElementById('count-critical');
    const elHigh = document.getElementById('count-high');
    const elMed = document.getElementById('count-medium');
    const elLow = document.getElementById('count-low');

    if (elCrit) elCrit.textContent = getActivePostCount(posts.filter(p => p.aiScore === 'Critical'));
    if (elHigh) elHigh.textContent = getActivePostCount(posts.filter(p => p.aiScore === 'High'));
    if (elMed) elMed.textContent = getActivePostCount(posts.filter(p => p.aiScore === 'Medium'));
    if (elLow) elLow.textContent = getActivePostCount(posts.filter(p => p.aiScore === 'Low'));
  }

  // Render Left Profile Sidebar
  function renderProfileCard(profileUser, isViewingOtherUser = false) {
    const container = document.getElementById('profile-card-container');
    if (!container) return;

    const initials = profileUser.name ? profileUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'A';
    const isCitizen = profileUser.role === 'citizen';
    const bioText = profileUser.bio || (isCitizen ? 'Civic advocate and SupportArena contributor.' : 'Admin Supervisor & Dispatch Lead.');

    let profileActionsHtml = '';
    let logoutBtnHtml = '';

    if (!isViewingOtherUser) {
      profileActionsHtml = `
        <div class="profile-actions" style="display: flex; flex-direction: column; width: 100%; margin-top: 16px;">
          <button class="small secondary" id="btn-edit-profile" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; padding: 10px 16px; border-radius: 8px; font-weight: 600;">⚙️ Edit Profile</button>
        </div>
      `;

      logoutBtnHtml = `
        <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; width: 100%;">
          <button class="primary" id="btn-profile-logout" style="width: 100%; justify-content: center; background: #374151; border: 1px solid var(--border); font-size: 0.9rem; padding: 10px 16px; border-radius: 8px; font-weight: 700; color: #fff;">Logout</button>
        </div>
      `;
    } else {
      profileActionsHtml = `
        <div class="profile-actions" style="display: flex; flex-direction: column; width: 100%; margin-top: 16px;">
          <button class="small primary" id="btn-back-to-own-profile" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 10px 16px; border-radius: 8px; font-weight: 600;">⬅️ Back to My Profile</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="profile-card" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow);">
        <div class="profile-avatar" style="width: 80px; height: 80px; border-radius: 50%; background: var(--danger); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; border: 2px solid rgba(255, 255, 255, 0.1);">${initials}</div>
        <div class="profile-info" style="width: 100%;">
          <h4 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: var(--text); font-family: 'Outfit', sans-serif;">${profileUser.name}</h4>
          <span class="profile-username" style="display: block; font-size: 0.85rem; color: var(--text-light); margin-bottom: 4px;">@${profileUser.username || 'user'}</span>
          <span class="profile-email" style="display: block; font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px; font-family: monospace;">${profileUser.email}</span>
          <p class="profile-bio" style="font-size: 0.85rem; color: var(--text-light); line-height: 1.4; margin-top: 12px;">${bioText}</p>
        </div>
        ${profileActionsHtml}
        
        <div id="profile-edit-panel" class="profile-edit-panel hidden" style="width: 100%; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; text-align: left;">
          <label for="edit-profile-name" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-light); margin-bottom:4px;">Display Name</label>
          <input type="text" id="edit-profile-name" value="${profileUser.name}" placeholder="Name" style="margin-bottom: 12px; padding: 8px 12px; font-size: 0.85rem;" />
          <button class="small primary" id="btn-save-profile" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 8px 12px;">Save Name</button>
        </div>
        
        ${logoutBtnHtml}
      </div>
    `;

    // Event Bindings
    if (!isViewingOtherUser) {
      const editPanel = document.getElementById('profile-edit-panel');
      document.getElementById('btn-edit-profile').addEventListener('click', () => {
        editPanel.classList.toggle('hidden');
      });

      document.getElementById('btn-profile-logout').addEventListener('click', logout);

      document.getElementById('btn-save-profile').addEventListener('click', () => {
        const newName = document.getElementById('edit-profile-name').value.trim();
        if (!newName) return;
        currentUser.name = newName;
        
        const users = window.getStoredUsers();
        const idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          users[idx].name = newName;
          window.saveUsers(users);
        }
        editPanel.classList.add('hidden');
        
        const appRoleLabel = document.getElementById('app-role-label');
        if (appRoleLabel) appRoleLabel.textContent = newName + ' (Admin)';
        
        refreshDashboard();
      });
    } else {
      document.getElementById('btn-back-to-own-profile').addEventListener('click', () => {
        activeTimelineUserId = null;
        renderProfileCard(currentUser, false);
        renderFeed();
      });
    }
  }

  // Render Center Column Timeline Feed
  function renderFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    let posts = window.getStoredPosts();
    
    if (activeTimelineUserId) {
      posts = posts.filter(p => p.userId === activeTimelineUserId);
    }

    if (posts.length === 0) {
      feedContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--text-light); padding: 40px 20px;">No civic issues posted on the timeline.</div>`;
      return;
    }

    feedContainer.innerHTML = posts.map(post => {
      const creator = window.getStoredUsers().find(u => u.id === post.userId) || 
                      window.getStoredOrgs().find(o => o.id === post.userId) || 
                      { name: 'Anonymous', username: 'anon', role: 'citizen' };
                      
      const replies = window.getStoredReplies().filter(r => r.postId === post.id);
      const isExpanded = expandedPosts.has(post.id);
      const initials = creator.name ? creator.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
      
      let mediaHtml = '';
      if (post.mediaUrl) {
        mediaHtml = `<div class="post-media-attachment" style="margin-top:12px; border-radius:8px; overflow:hidden;"><img src="${post.mediaUrl}" alt="Attachment" style="max-height: 300px; width: auto; max-width: 100%; border-radius: 8px;" /></div>`;
      }

      // Check if this post is resolved
      const dispatches = window.getStoredDispatches();
      const postDispatch = dispatches.find(d => d.postId === post.id);
      const isResolved = postDispatch && postDispatch.status === 'Resolved';
      const resolvedBadge = isResolved 
        ? `<span class="resolved-tag" style="background: rgba(16,185,129,0.1); color: var(--success); border: 1px solid rgba(16,185,129,0.2); padding: 2px 6px; border-radius:4px; font-size:0.75rem; font-weight:700; margin-left: 8px;">[RESOLVED]</span>` 
        : '';

      // Check if user has liked/disliked
      if (!post.likes) post.likes = [];
      if (!post.dislikes) post.dislikes = [];
      const hasLiked = post.likes.includes(currentUser.id);
      const hasDisliked = post.dislikes.includes(currentUser.id);

      // Recursive Reddit-style replies layout
      let repliesHtml = '';
      if (isExpanded) {
        const topLevelReplies = replies.filter(r => !r.parentId);
        
        const buildRepliesTreeHtml = (reply) => {
          const repInitials = reply.name ? reply.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
          const roleBadgeClass = reply.role === 'admin' ? 'admin' : reply.role === 'organization' ? 'organization' : 'citizen';
          const childReplies = replies.filter(r => r.parentId === reply.id);
          const childrenHtml = childReplies.map(child => buildRepliesTreeHtml(child)).join('');
          
          return `
            <div class="comment-node" id="comment-node-${reply.id}" style="margin-top: 10px; display: flex; flex-direction: column; width: 100%;">
              <div class="comment-card" style="position: relative; padding: 8px 0; background: transparent;">
                <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <div class="comment-user-info btn-view-profile" data-creator-id="${reply.userId}" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <div class="comment-avatar" style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;">${repInitials}</div>
                    <div style="display: flex; flex-direction: column;">
                      <strong class="comment-name" style="font-size: 0.85rem; font-weight: 700; color: var(--text);">${reply.name}</strong>
                      <span class="comment-role-tag ${roleBadgeClass}" style="align-self: flex-start; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; padding: 1px 6px; border-radius: 4px; margin-top: 2px;">${reply.role}</span>
                    </div>
                  </div>
                  <span class="comment-time" style="font-size: 0.7rem; color: var(--text-light);">${new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p class="comment-text" style="font-size: 0.88rem; line-height: 1.5; color: var(--text); padding-left: 38px;">${reply.text}</p>
                
                <div class="comment-actions" style="margin-top: 8px; padding-left: 38px; display: flex; gap: 16px; font-size: 0.75rem;">
                  <span class="btn-reply-to-comment" data-post-id="${post.id}" data-comment-id="${reply.id}" style="cursor: pointer; font-weight: 600; color: var(--primary); display: inline-flex; align-items: center; gap: 4px; user-select: none;">💬 Reply</span>
                </div>
                
                <!-- Inline nested reply composer -->
                <div class="inline-comment-composer hidden" id="composer-comment-${reply.id}" style="margin-top: 12px; margin-left: 38px; display: flex; gap: 8px;">
                  <input type="text" id="input-comment-${reply.id}" placeholder="Reply to ${reply.name}..." style="flex: 1; border-radius: 20px; padding: 8px 16px; font-size: 0.8rem; background: var(--bg); border: 1px solid var(--border); color: var(--text);" />
                  <button class="primary small btn-comment-submit-nested" data-post-id="${post.id}" data-parent-id="${reply.id}">Reply</button>
                </div>
              </div>
              
              ${childReplies.length > 0 ? `
                <div class="comment-children" style="margin-left: 28px; border-left: 2px solid var(--border); padding-left: 14px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                  ${childrenHtml}
                </div>
              ` : ''}
            </div>
          `;
        };

        const listHtml = topLevelReplies.map(reply => buildRepliesTreeHtml(reply)).join('');

        repliesHtml = `
          <div class="replies-thread-container" style="border-top: 1px dashed var(--border); margin-top: 14px; padding-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            ${listHtml}
            <div class="comment-composer" style="display: flex; gap: 8px; margin-top: 10px;">
              <input type="text" id="comment-input-${post.id}" placeholder="Write a civic statement..." style="flex: 1; border-radius: 20px; padding: 8px 16px; font-size: 0.85rem;" />
              <button class="primary small btn-comment-submit" data-post-id="${post.id}">Comment</button>
            </div>
          </div>
        `;
      }

      // Moderation Action for Admin
      const ownershipActions = `
        <button class="secondary small btn-delete-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger); cursor:pointer;">🗑️ Moderate Delete</button>
      `;

      // Render dispatch status badge
      let activeDispatchBadge = '';
      if (postDispatch) {
        const dispatchedOrg = window.getStoredOrgs().find(o => o.id === postDispatch.orgId);
        const statusClass = postDispatch.status.toLowerCase();
        activeDispatchBadge = `
          <span class="dispatch-badge ${statusClass}" style="font-size: 0.8rem; font-weight: 700; color: var(--primary); margin-left: auto;">
            🔧 Dispatched: ${dispatchedOrg ? dispatchedOrg.name : 'Agency'} (${postDispatch.status})
          </span>
        `;
      }

      const toggleText = isExpanded ? `Hide Comments (${replies.length})` : `Show Comments (${replies.length})`;
      const toggleArrow = isExpanded ? '▲' : '▼';

      return `
        <div class="post-card card" id="post-card-${post.id}" style="padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border); background: var(--surface-card);">
          <div class="post-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div class="post-user-meta btn-view-profile" data-creator-id="${post.userId}" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <div class="post-user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight:700;">${initials}</div>
              <div>
                <strong class="post-creator-name" style="color: var(--text); display:block;">${creator.name}</strong>
                <span class="post-username" style="font-size: 0.75rem; color: var(--text-light);">@${creator.username} • ${creator.role.toUpperCase()}</span>
              </div>
            </div>
            ${ownershipActions}
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center;">
            <div class="post-location-pill" style="font-size: 0.75rem; font-weight:700; color:var(--text-light); text-transform:uppercase; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.04);">📍 ${post.location.toUpperCase()}</div>
            <div class="category-chip" style="font-size: 0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase; padding: 4px 8px; border-radius: 4px; background: rgba(59,130,246,0.1);">${post.category.toUpperCase()}</div>
            <div class="ai-priority-badge ${post.aiScore.toLowerCase()}" style="font-size:0.75rem; padding: 4px 8px;">AI: ${post.aiScore.toUpperCase()}</div>
            ${resolvedBadge}
            ${activeDispatchBadge}
          </div>

          <h3 class="post-title" style="font-size: 1.25rem; font-weight: 700; color: var(--text); margin-bottom: 8px; font-family:'Outfit', sans-serif;">${post.title}</h3>
          <p class="post-description" style="font-size: 0.95rem; line-height: 1.5; color: var(--text); margin-bottom: 12px;">${post.desc}</p>
          
          ${mediaHtml}
          
          <div class="post-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; border-top: 1px solid var(--border); padding-top: 12px;">
            <div style="display: flex; gap: 8px;">
              <button class="secondary small btn-like-post ${hasLiked ? 'active' : ''}" data-post-id="${post.id}" style="padding: 6px 12px; font-size: 0.8rem; border-radius:6px; cursor:pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; border-color: ${hasLiked ? 'var(--primary)' : 'var(--border)'}; color: ${hasLiked ? 'var(--primary)' : 'var(--text)'};">
                👍 ${post.likes.length}
              </button>
              <button class="secondary small btn-dislike-post ${hasDisliked ? 'active' : ''}" data-post-id="${post.id}" style="padding: 6px 12px; font-size: 0.8rem; border-radius:6px; cursor:pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; border-color: ${hasDisliked ? 'var(--danger)' : 'var(--border)'}; color: ${hasDisliked ? 'var(--danger)' : 'var(--text)'};">
                👎 ${post.dislikes.length}
              </button>
            </div>
            <div class="show-replies-link" data-post-id="${post.id}" style="cursor:pointer; color: var(--primary); font-size: 0.85rem; font-weight:600;">
              💬 ${toggleText} ${toggleArrow}
            </div>
          </div>

          ${repliesHtml}
        </div>
      `;
    }).join('');

    attachTimelineEventHandlers();
  }

  // Setup Timeline Event Listeners
  function attachTimelineEventHandlers() {
    // Like button
    document.querySelectorAll('.btn-like-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          if (!post.likes) post.likes = [];
          if (!post.dislikes) post.dislikes = [];
          
          if (post.likes.includes(currentUser.id)) {
            post.likes = post.likes.filter(id => id !== currentUser.id);
          } else {
            post.likes.push(currentUser.id);
            post.dislikes = post.dislikes.filter(id => id !== currentUser.id);
          }
          window.savePosts(posts);
          renderFeed();
        }
      });
    });

    // Dislike button
    document.querySelectorAll('.btn-dislike-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          if (!post.likes) post.likes = [];
          if (!post.dislikes) post.dislikes = [];
          
          if (post.dislikes.includes(currentUser.id)) {
            post.dislikes = post.dislikes.filter(id => id !== currentUser.id);
          } else {
            post.dislikes.push(currentUser.id);
            post.likes = post.likes.filter(id => id !== currentUser.id);
          }
          window.savePosts(posts);
          renderFeed();
        }
      });
    });

    // Expand/Collapse replies
    document.querySelectorAll('.show-replies-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        if (expandedPosts.has(postId)) {
          expandedPosts.delete(postId);
        } else {
          expandedPosts.add(postId);
        }
        renderFeed();
      });
    });

    // Delete Post (Moderation)
    document.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        if (confirm("Are you sure you want to moderate-delete this report?")) {
          const posts = window.getStoredPosts().filter(p => p.id !== postId);
          window.savePosts(posts);
          
          // Clean up dispatches related to this deleted post
          const dispatches = window.getStoredDispatches().filter(d => d.postId !== postId);
          window.saveDispatches(dispatches);

          // Close dispatch card if we deleted the active one
          if (expandedDispatchPostId === postId) {
            expandedDispatchPostId = null;
          }

          refreshDashboard();
        }
      });
    });

    // Toggle inline nested comment composer
    document.querySelectorAll('.btn-reply-to-comment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const commentId = e.currentTarget.getAttribute('data-comment-id');
        const comp = document.getElementById(`composer-comment-${commentId}`);
        if (comp) {
          comp.classList.toggle('hidden');
          const inp = document.getElementById(`input-comment-${commentId}`);
          if (inp && !comp.classList.contains('hidden')) {
            inp.focus();
          }
        }
      });
    });

    // Submit top-level reply
    document.querySelectorAll('.btn-comment-submit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const input = document.getElementById(`comment-input-${postId}`);
        const text = input ? input.value.trim() : '';
        if (!text) return;

        const newReply = {
          id: 'rep-' + Date.now(),
          postId: postId,
          userId: currentUser.id,
          name: currentUser.name,
          role: 'admin',
          text: text,
          createdAt: new Date().toISOString()
        };

        const replies = window.getStoredReplies();
        replies.push(newReply);
        window.saveReplies(replies);
        
        // Notify post owner
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== currentUser.id) {
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: post.userId,
            title: 'Admin Response',
            message: `Admin Supervisor commented on your report: "${text.substring(0, 40)}"`,
            read: false,
            createdAt: new Date().toISOString()
          });
          window.saveNotifications(notifications);
        }

        input.value = '';
        renderFeed();
      });
    });

    // Submit nested reply
    document.querySelectorAll('.btn-comment-submit-nested').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const parentId = e.currentTarget.getAttribute('data-parent-id');
        const input = document.getElementById(`input-comment-${parentId}`);
        const text = input ? input.value.trim() : '';
        if (!text) return;

        const newReply = {
          id: 'rep-' + Date.now(),
          postId: postId,
          parentId: parentId,
          userId: currentUser.id,
          name: currentUser.name,
          role: 'admin',
          text: text,
          createdAt: new Date().toISOString()
        };

        const replies = window.getStoredReplies();
        replies.push(newReply);
        window.saveReplies(replies);

        // Notify parent comment creator
        const parentComment = replies.find(r => r.id === parentId);
        const targetUserId = parentComment ? parentComment.userId : null;

        if (targetUserId && targetUserId !== currentUser.id) {
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: targetUserId,
            title: 'Admin Response',
            message: `Admin Supervisor replied to your comment: "${text.substring(0, 40)}"`,
            read: false,
            createdAt: new Date().toISOString()
          });
          window.saveNotifications(notifications);
        }

        input.value = '';
        renderFeed();
      });
    });

    // View user profiles from feed
    document.querySelectorAll('.btn-view-profile').forEach(element => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        const creatorId = e.currentTarget.getAttribute('data-creator-id');
        let targetUser = window.getStoredUsers().find(u => u.id === creatorId);
        if (!targetUser) targetUser = window.getStoredOrgs().find(o => o.id === creatorId);
        
        if (targetUser) {
          const isOwn = targetUser.id === currentUser.id;
          activeTimelineUserId = isOwn ? null : targetUser.id;
          renderProfileCard(targetUser, !isOwn);
          renderFeed();
        }
      });
    });
  }

  // Render AI Critical Incident Queue (Right Sidebar)
  function renderAICriticalIncidentQueue() {
    const queueList = document.getElementById('ai-critical-queue-list');
    if (!queueList) return;

    const posts = window.getStoredPosts();
    const dispatches = window.getStoredDispatches();

    // 1. Filter out already resolved issues
    let activeQueuePosts = posts.filter(p => !dispatches.some(d => d.postId === p.id && d.status === 'Resolved'));

    // 2. Apply severity queue filter (Critical, High, Medium, Low).
    activeQueuePosts = activeQueuePosts.filter(p => p.aiScore === activeSeverityFilter);

    if (activeQueuePosts.length === 0) {
      queueList.innerHTML = `<p class="empty-list" style="font-size:0.75rem; text-align:center;">No active issues in this queue.</p>`;
      return;
    }

    queueList.innerHTML = activeQueuePosts.map(post => {
      const isDispatched = dispatches.some(d => d.postId === post.id);
      const isSelected = expandedDispatchPostId === post.id;
      
      let dispatchStatusHtml = '';
      if (isDispatched) {
        const disp = dispatches.find(d => d.postId === post.id);
        const dispOrg = window.getStoredOrgs().find(o => o.id === disp.orgId);
        dispatchStatusHtml = `<span style="font-size:0.65rem; color:var(--primary); font-weight:700; margin-top:2px; display:block;">🔧 Active Dispatch: ${dispOrg ? dispOrg.name : 'Agency'} (${disp.status})</span>`;
      }

      return `
        <div class="ai-queue-item ${isSelected ? 'active-selection' : ''}" id="queue-item-${post.id}" style="border-left: 3px solid ${post.aiScore === 'Critical' ? 'var(--danger)' : 'var(--warning)'}; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: ${isSelected ? 'rgba(59,130,246,0.1)' : 'var(--surface-hover)'}; cursor:pointer; transition: background 0.2s;">
          <div class="ai-queue-item-meta" style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:0.8rem; color: var(--text);">${post.title}</strong>
            <span class="ai-priority-badge ${post.aiScore.toLowerCase()}" style="font-size:0.65rem; padding: 2px 6px;">${post.aiScore}</span>
          </div>
          <span style="font-size:0.7rem; color:var(--text-light); display:block; margin-top:2px;">📍 ${post.location}</span>
          ${dispatchStatusHtml}
        </div>
      `;
    }).join('');

    attachQueueEventHandlers();
  }

  // Bind right sidebar queue click triggers
  function attachQueueEventHandlers() {
    // Click queue item to trigger dispatch card display
    document.querySelectorAll('.ai-queue-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const postId = e.currentTarget.id.replace('queue-item-', '');
        if (expandedDispatchPostId === postId) {
          expandedDispatchPostId = null; // Toggle close
        } else {
          expandedDispatchPostId = postId; // Open this issue
        }
        
        // Re-render critical queue lists to update active states
        renderAICriticalIncidentQueue();
        renderDispatchTaskCard();
      });
    });
  }

  // Populate and Display the Dispatch Task Card
  function renderDispatchTaskCard() {
    const card = document.getElementById('dispatch-task-card');
    if (!card) return;

    if (!expandedDispatchPostId) {
      card.classList.add('hidden');
      return;
    }

    const post = window.getStoredPosts().find(p => p.id === expandedDispatchPostId);
    if (!post) {
      card.classList.add('hidden');
      expandedDispatchPostId = null;
      return;
    }

    const titlePara = document.getElementById('dispatch-post-title');
    const select = document.getElementById('dispatch-select');
    const instructions = document.getElementById('dispatch-instructions');
    
    // Set post title
    if (titlePara) {
      titlePara.textContent = post.title;
    }

    // Populate agency dropdown options
    if (select) {
      const orgs = window.getStoredOrgs();
      select.innerHTML = orgs.map(o => `
        <option value="${o.id}">${o.name} (${o.type} - Area: ${o.area})</option>
      `).join('');
    }

    // Clear instructions input box
    if (instructions) {
      instructions.value = '';
    }

    card.classList.remove('hidden');
  }

  // Setup Dispatch Card Event listeners
  function setupDispatchFormEvents() {
    const cancelBtn = document.getElementById('dispatch-cancel-btn');
    const submitBtn = document.getElementById('dispatch-submit-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        expandedDispatchPostId = null;
        renderAICriticalIncidentQueue();
        renderDispatchTaskCard();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (!expandedDispatchPostId) return;

        const orgId = document.getElementById('dispatch-select').value;
        const instructions = document.getElementById('dispatch-instructions').value.trim();

        if (!orgId || !instructions) {
          alert('Please select a municipal agency and enter instructions.');
          return;
        }

        const newDispatch = {
          id: 'disp-' + Date.now(),
          postId: expandedDispatchPostId,
          orgId: orgId,
          instructions: instructions,
          status: 'In Progress',
          feedback: '',
          createdAt: new Date().toISOString()
        };

        const dispatches = window.getStoredDispatches();
        dispatches.push(newDispatch);
        window.saveDispatches(dispatches);

        // Notify poster
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === expandedDispatchPostId);
        const org = window.getStoredOrgs().find(o => o.id === orgId);
        
        if (post && org) {
          // Push notifications to poster and organization
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: post.userId,
            title: 'Dispatch Initiated',
            message: `Your report "${post.title}" has been dispatched to ${org.name}.`,
            read: false,
            createdAt: new Date().toISOString(),
            dispatchId: newDispatch.id,
            postId: post.id
          });
          notifications.unshift({
            id: 'notif-org-' + Date.now(),
            userId: org.id,
            title: 'New Dispatch Assigned',
            message: `Admin has assigned you a new task: "${post.title}". Instructions: "${instructions}"`,
            read: false,
            createdAt: new Date().toISOString(),
            dispatchId: newDispatch.id,
            postId: post.id
          });
          window.saveNotifications(notifications);

          // Add comment statement automatically to post
          const replies = window.getStoredReplies();
          replies.push({
            id: 'rep-' + Date.now(),
            postId: expandedDispatchPostId,
            userId: currentUser.id,
            name: currentUser.name,
            role: 'admin',
            text: `🛠️ DISPATCHED: Handed over task to ${org.name}. Instructions: "${instructions}"`,
            createdAt: new Date().toISOString()
          });
          window.saveReplies(replies);
        }

        // Reset and refresh
        expandedDispatchPostId = null;
        refreshDashboard();
      });
    }
  }

  // Render Active Help Dispatches Panel (Right Sidebar Bottom)
  function renderActiveHelpDispatches() {
    const list = document.getElementById('sidebar-dispatch-list');
    if (!list) return;

    const dispatches = window.getStoredDispatches().filter(d => d.status !== 'Resolved');
    const orgs = window.getStoredOrgs();
    const posts = window.getStoredPosts();

    if (dispatches.length === 0) {
      list.innerHTML = `<p class="empty-list" style="font-size:0.75rem; text-align:center;">No active dispatches currently.</p>`;
      return;
    }

    list.innerHTML = dispatches.map(d => {
      const post = posts.find(p => p.id === d.postId) || { title: 'Deleted Issue' };
      const org = orgs.find(o => o.id === d.orgId) || { name: 'Unknown Responder' };
      const statusClass = d.status.toLowerCase().replace(' ', '-');
      
      let actionBtnHtml = '';
      if (d.status === 'Pending Clearance') {
        actionBtnHtml = `
          <button class="primary small btn-clear-dispatch" data-disp-id="${d.id}" style="margin-top: 8px; width: 100%; justify-content: center; font-size: 0.75rem; padding: 6px; border-radius:6px; cursor:pointer; background: var(--success); color: #fff;">Clear Dispatch</button>
        `;
      }

      return `
        <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding-left: 8px; padding-bottom: 6px; margin-bottom: 8px; border-bottom:1px solid rgba(255,255,255,0.02);">
          <div class="ai-queue-item-meta" style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
            <strong style="color: var(--text);">${org.name}</strong>
            <span class="disp-status ${statusClass}" style="font-size:0.65rem; padding: 2px 6px; font-weight:700; border-radius:4px; background: rgba(59,130,246,0.1); color: var(--primary);">${d.status}</span>
          </div>
          <p style="font-size:0.75rem; margin-top:4px; color: var(--text);">Issue: ${post.title}</p>
          ${d.feedback ? `<p style="font-size:0.7rem; color:var(--success); font-style:italic; margin-top:2px;">💬 Feed: ${d.feedback}</p>` : ''}
          ${actionBtnHtml}
        </div>
      `;
    }).join('');

    // Bind clear dispatch click listeners
    list.querySelectorAll('.btn-clear-dispatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dispId = e.currentTarget.getAttribute('data-disp-id');
        clearDispatch(dispId);
      });
    });
  }

  function setupHeaderEvents() {
    const logoHome = document.getElementById('header-logo-home');
    if (logoHome) {
      logoHome.addEventListener('click', () => {
        activeTimelineUserId = null;
        refreshDashboard();
      });
    }
  }

  // Clear pending dispatches and resolve the underlying issue
  function clearDispatch(dispId) {
    const allDispatches = window.getStoredDispatches();
    const dIdx = allDispatches.findIndex(d => d.id === dispId);
    if (dIdx !== -1) {
      const dispatch = allDispatches[dIdx];
      dispatch.status = 'Resolved';
      window.saveDispatches(allDispatches);

      const posts = window.getStoredPosts();
      const post = posts.find(p => p.id === dispatch.postId);
      const orgs = window.getStoredOrgs();
      const org = orgs.find(o => o.id === dispatch.orgId);

      if (post && org) {
        // 1. Notify reporting citizen
        const notifs = window.getStoredNotifications();
        notifs.unshift({
          id: 'notif-' + Date.now(),
          userId: post.userId,
          title: 'Issue Resolved!',
          message: `Your report "${post.title}" has been resolved by ${org.name}. Feedback: "${dispatch.feedback}"`,
          read: false,
          createdAt: new Date().toISOString(),
          dispatchId: dispatch.id,
          postId: post.id
        });

        // 2. Remove related notifications from organization and admin notifications list
        const updatedNotifs = notifs.filter(n => {
          const isRelated = n.dispatchId === dispatch.id || n.postId === post.id || n.message.includes(post.title) || n.message.includes(post.title.substring(0, 15));
          const isOrgOrAdmin = n.userId === org.id || n.userId === 'admin-1';
          return !(isRelated && isOrgOrAdmin);
        });
        window.saveNotifications(updatedNotifs);

        // 3. Auto-reply timeline comment (from Admin)
        const replies = window.getStoredReplies();
        replies.push({
          id: 'rep-' + Date.now(),
          postId: post.id,
          userId: currentUser.id,
          name: currentUser.name,
          role: 'admin',
          text: `✅ DISPATCH CLEARED & RESOLVED: Admin approved resolution work by ${org.name}. Final Feedback: "${dispatch.feedback}"`,
          createdAt: new Date().toISOString()
        });
        window.saveReplies(replies);
      }

      refreshDashboard();
    }
  }

  // Render Sidebar Reply Alerts Panel
  function renderNotificationsPanel() {
    const listContainer = document.getElementById('notifications-list-container');
    if (!listContainer) return;

    const notifs = window.getStoredNotifications().filter(n => n.userId === currentUser.id);
    
    if (notifs.length === 0) {
      listContainer.innerHTML = `<p class="empty-list" style="font-size:0.75rem; text-align:center;">No alerts. You will be notified here when dispatches or feed items update.</p>`;
      return;
    }

    listContainer.innerHTML = notifs.map(n => {
      // Check if this is a feedback clearance notification
      const isFeedbackNotif = n.title === 'Feedback Clearance Required' && n.dispatchId;
      
      let actionBtnHtml = '';
      if (isFeedbackNotif) {
        actionBtnHtml = `
          <button class="primary small btn-clear-dispatch-notif" data-disp-id="${n.dispatchId}" style="margin-top: 8px; width: 100%; justify-content: center; font-size: 0.75rem; padding: 6px; border-radius:6px; cursor:pointer; background: var(--success); color: #fff; border: none;">Clear Dispatch</button>
        `;
      }

      return `
        <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.02); position: relative;">
          <button class="btn-dismiss-notif" data-notif-id="${n.id}" style="position: absolute; right: 8px; top: 8px; background: none; border: none; color: var(--text-light); cursor: pointer; font-size: 0.8rem;" title="Dismiss notification">✕</button>
          <div class="ai-queue-item-meta" style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-light); padding-right: 16px;">
            <strong>${n.title}</strong>
            <span>${new Date(n.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          </div>
          <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text);">${n.message}</p>
          ${actionBtnHtml}
        </div>
      `;
    }).join('');

    // Bind event listeners for dismissing notifications
    listContainer.querySelectorAll('.btn-dismiss-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const notifId = e.currentTarget.getAttribute('data-notif-id');
        dismissNotification(notifId);
      });
    });

    // Bind event listeners for clearance button inside notification
    listContainer.querySelectorAll('.btn-clear-dispatch-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dispId = e.currentTarget.getAttribute('data-disp-id');
        clearDispatch(dispId);
      });
    });
  }

  function dismissNotification(notifId) {
    const allNotifs = window.getStoredNotifications();
    const notif = allNotifs.find(n => n.id === notifId);
    if (notif) {
      // If this is a feedback clearance notification, dismissing it also resolves the dispatch!
      if (notif.title === 'Feedback Clearance Required' && notif.dispatchId) {
        clearDispatch(notif.dispatchId);
        return; // clearDispatch will handle updating notifications and saving
      }
      
      // Otherwise, just remove the single notification
      const updatedNotifs = allNotifs.filter(n => n.id !== notifId);
      window.saveNotifications(updatedNotifs);
      refreshDashboard();
    }
  }

  // Clear Notifications
  function clearAllNotifications() {
    const allNotifs = window.getStoredNotifications().filter(n => n.userId !== currentUser.id);
    window.saveNotifications(allNotifs);
    refreshDashboard();
  }

  // App Initialization
  window.addEventListener('DOMContentLoaded', () => {
    window.initializeDatabase(); // Crucial: guarantee seed data parsed on refresh
    initTheme();
    checkSession();
  });

  // Cross-Tab Syncing
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('supportArena_feed:')) {
      refreshDashboard();
    }
  });

  // Firestore Sync Listeners
  document.addEventListener('refresh-feed', () => {
    console.log("⚡ Received refresh-feed event, refreshing admin dashboard...");
    refreshDashboard();
  });
})();
