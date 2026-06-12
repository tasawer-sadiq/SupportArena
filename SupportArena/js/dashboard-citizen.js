// Citizen Dashboard Coordinator for SupportArena
(function() {
  let currentUser = null;
  let activeTimelineUserId = null;
  let composerMediaDataUrl = '';
  const expandedPosts = new Set();
  
  // Outer variables to preserve callbacks
  let cachedOnProfileChanged = null;
  let cachedOnSelectOwnTimeline = null;

  // AI Criticality Analyzer
  function analyzeAICriticality(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const criticalKeywords = ['fire', 'explosion', 'sparking', 'immediate danger', 'injury', 'collapsed', 'flooding', 'toxic', 'poison', 'gas leak', 'electrocution', 'wires sparking'];
    const highKeywords = ['broken', 'leak', 'outage', 'accident', 'robbery', 'crime', 'blockage', 'hole', 'pothole', 'dark', 'smell', 'unsafe', 'smog', 'air pollution', 'gas shortage', 'pressure drop'];
    const mediumKeywords = ['garbage', 'litter', 'trash', 'odor', 'noise', 'dust', 'park', 'renovation', 'overflowing'];

    if (criticalKeywords.some(kw => text.includes(kw))) return 'Critical';
    if (highKeywords.some(kw => text.includes(kw))) return 'High';
    if (mediumKeywords.some(kw => text.includes(kw))) return 'Medium';
    return 'Low';
  }

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
      
      if (!user) {
        // Check if they are an organization or admin and redirect accordingly
        const org = window.getStoredOrgs().find(o => o.id === data.id);
        if (org) {
          window.location.href = 'dashboard-org.html';
          return;
        }
        if (data.id === 'admin-1') {
          window.location.href = 'dashboard-admin.html';
          return;
        }
        
        sessionStorage.removeItem('supportArena_session');
        localStorage.removeItem('supportArena_session');
        window.location.href = 'index.html';
        return;
      }
      
      if (user.role !== 'citizen') {
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
  function logout() {
    sessionStorage.removeItem('supportArena_session');
    localStorage.removeItem('supportArena_session');
    window.location.href = 'index.html';
  }

  // Account deletion
  async function deleteAccount() {
    const confirm1 = confirm("Are you sure you want to permanently delete your citizen account? This action cannot be undone.");
    if (confirm1) {
      const confirm2 = confirm("Confirm deletion for " + currentUser.email + "? All your records will be purged.");
      if (confirm2) {
        try {
          if (typeof window.deleteUserAccount === 'function') {
            await window.deleteUserAccount(currentUser.id, currentUser.role, currentUser.email);
          } else {
            const users = window.getStoredUsers().filter(u => u.id !== currentUser.id);
            window.saveUsers(users);
          }
          alert("Your account has been deleted successfully.");
          logout();
        } catch (err) {
          alert("Error deleting account: " + err.message);
        }
      }
    }
  }

  // Initialize Page Component
  function initializeDashboard() {
    // Set role badge text
    const appRoleLabel = document.getElementById('app-role-label');
    if (appRoleLabel) {
      appRoleLabel.textContent = currentUser.name + ' (Citizen)';
    }

    // Set composer avatar initials
    const compInit = document.getElementById('composer-avatar-init');
    if (compInit && currentUser.name) {
      compInit.textContent = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    // Setup events
    setupComposerEvents();
    setupHeaderEvents();
    
    // Initial Render
    refreshDashboard();
  }

  function refreshDashboard() {
    renderProfileCard(currentUser, false);
    renderUpcomingAlertBanner();
    renderFeed();
    renderNotificationsPanel();
  }

  // Render Left Profile Sidebar
  function renderProfileCard(profileUser, isViewingOtherUser = false) {
    const container = document.getElementById('profile-card-container');
    if (!container) return;

    const initials = profileUser.name ? profileUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
    const bioText = profileUser.bio || 'Civic advocate and SupportArena contributor.';

    let profileActionsHtml = '';
    let logoutBtnHtml = '';

    if (!isViewingOtherUser) {
      profileActionsHtml = `
        <div class="profile-actions" style="display: flex; flex-direction: column; width: 100%; margin-top: 16px;">
          <button class="small secondary" id="btn-my-posts" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; padding: 10px 16px; margin-bottom: 8px; border-radius: 8px; font-weight: 600;">📄 View My Posts</button>
          <button class="small secondary" id="btn-edit-profile" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; padding: 10px 16px; border-radius: 8px; font-weight: 600;">⚙️ Edit Profile</button>
        </div>
      `;

      logoutBtnHtml = `
        <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; width: 100%; display: flex; flex-direction: column; gap: 8px;">
          <button class="primary" id="btn-profile-logout" style="width: 100%; justify-content: center; background: #374151; border: 1px solid var(--border); font-size: 0.9rem; padding: 10px 16px; border-radius: 8px; font-weight: 700; color: #fff;">Logout</button>
          <button class="primary" id="btn-profile-delete" style="width: 100%; justify-content: center; background: #ef4444; border: none; font-size: 0.9rem; padding: 10px 16px; border-radius: 8px; font-weight: 700; color: #fff;">Delete Account</button>
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
        <div class="profile-avatar" style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; border: 2px solid rgba(255, 255, 255, 0.1);">${initials}</div>
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
      document.getElementById('btn-my-posts').addEventListener('click', () => {
        if (activeTimelineUserId === currentUser.id) {
          activeTimelineUserId = null;
        } else {
          activeTimelineUserId = currentUser.id;
        }
        renderFeed();
      });

      const editPanel = document.getElementById('profile-edit-panel');
      document.getElementById('btn-edit-profile').addEventListener('click', () => {
        editPanel.classList.toggle('hidden');
      });

      document.getElementById('btn-profile-logout').addEventListener('click', logout);
      document.getElementById('btn-profile-delete').addEventListener('click', deleteAccount);

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
        if (appRoleLabel) appRoleLabel.textContent = newName + ' (Citizen)';
        
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

  // Render Center Column Timeline Feed
  function renderFeed() {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;

    let posts = window.getStoredPosts();
    
    if (activeTimelineUserId) {
      posts = posts.filter(p => p.userId === activeTimelineUserId);
    }

    if (posts.length === 0) {
      feedContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--text-light); padding: 40px 20px;">No reports posted by this timeline filter.</div>`;
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

      // Check if we own this post
      let ownershipActions = '';
      if (post.userId === currentUser.id) {
        ownershipActions = `
          <div style="display: flex; gap: 8px;">
            <button class="secondary small btn-edit-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--warning); color: var(--warning);">✏️ Edit</button>
            <button class="secondary small btn-delete-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">🗑️ Delete</button>
          </div>
        `;
      }

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

    // Edit Post
    document.querySelectorAll('.btn-edit-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          const newDesc = prompt("Edit your post description:", post.desc);
          if (newDesc !== null && newDesc.trim() !== "") {
            post.desc = newDesc.trim();
            post.aiScore = analyzeAICriticality(post.title, post.desc);
            window.savePosts(posts);
            renderFeed();
          }
        }
      });
    });

    // Delete Post
    document.querySelectorAll('.btn-delete-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        if (confirm("Are you sure you want to delete this report?")) {
          const posts = window.getStoredPosts().filter(p => p.id !== postId);
          window.savePosts(posts);
          renderFeed();
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
          role: 'citizen',
          text: text,
          createdAt: new Date().toISOString()
        };

        const replies = window.getStoredReplies();
        replies.push(newReply);
        window.saveReplies(replies);
        
        // Push notification if this is a reply to someone else's post
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== currentUser.id) {
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: post.userId,
            title: 'New Comment Received',
            message: `User ${currentUser.name} commented: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
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
          role: 'citizen',
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
            title: 'New Thread Reply',
            message: `User ${currentUser.name} replied to your comment: "${text.substring(0, 40)}"`,
            read: false,
            createdAt: new Date().toISOString()
          });
          window.saveNotifications(notifications);
        }

        input.value = '';
        renderFeed();
      });
    });

    // Click on profile links to view other citizen profile
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

  // Render Sidebar Reply Alerts Panel
  function renderNotificationsPanel() {
    const listContainer = document.getElementById('notifications-list-container');
    if (!listContainer) return;

    const notifs = window.getStoredNotifications().filter(n => n.userId === currentUser.id);
    
    if (notifs.length === 0) {
      listContainer.innerHTML = `<p class="empty-list" style="font-size:0.75rem; text-align:center;">No reply alerts. You will be notified here when others reply to your posts.</p>`;
      return;
    }

    listContainer.innerHTML = notifs.map(n => `
      <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding: 8px; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.02); position: relative;">
        <button class="btn-dismiss-notif" data-notif-id="${n.id}" style="position: absolute; right: 8px; top: 8px; background: none; border: none; color: var(--text-light); cursor: pointer; font-size: 0.8rem;" title="Dismiss notification">✕</button>
        <div class="ai-queue-item-meta" style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-light); padding-right: 16px;">
          <strong>${n.title}</strong>
          <span>${new Date(n.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text);">${n.message}</p>
      </div>
    `).join('');

    // Bind event listeners for dismissing notifications
    listContainer.querySelectorAll('.btn-dismiss-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const notifId = e.currentTarget.getAttribute('data-notif-id');
        dismissNotification(notifId);
      });
    });
  }

  function dismissNotification(notifId) {
    const allNotifs = window.getStoredNotifications();
    const updatedNotifs = allNotifs.filter(n => n.id !== notifId);
    window.saveNotifications(updatedNotifs);
    refreshDashboard();
  }

  // Clear Notifications
  function clearAllNotifications() {
    const allNotifs = window.getStoredNotifications().filter(n => n.userId !== currentUser.id);
    window.saveNotifications(allNotifs);
    refreshDashboard();
  }

  // Setup Composer Event Handlers
  function setupComposerEvents() {
    const trigger = document.getElementById('composer-trigger');
    const triggerContainer = document.getElementById('composer-trigger-container');
    const form = document.getElementById('composer-form');
    const cancelBtn = document.getElementById('composer-cancel-btn');
    const submitBtn = document.getElementById('composer-submit-btn');
    const mediaInput = document.getElementById('composer-media-input');

    if (trigger && form && triggerContainer) {
      trigger.addEventListener('click', () => {
        triggerContainer.classList.add('hidden');
        form.classList.remove('hidden');
      });
    }

    if (cancelBtn && triggerContainer && form) {
      cancelBtn.addEventListener('click', () => {
        triggerContainer.classList.remove('hidden');
        form.classList.add('hidden');
        resetComposerMedia();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const title = document.getElementById('post-title').value.trim();
        const desc = document.getElementById('post-desc').value.trim();
        const location = document.getElementById('post-location').value.trim();
        const category = document.getElementById('post-category').value;

        if (!title || !desc) {
          alert('Please fill out the Title and Description fields.');
          return;
        }

        const aiPriority = analyzeAICriticality(title, desc);
        const credibilityLevels = ['Verified', 'High Credibility', 'Likely', 'Pending Verification'];
        const aiCred = (aiPriority === 'Critical' || aiPriority === 'High') ? 'Verified' : credibilityLevels[Math.floor(Math.random() * credibilityLevels.length)];

        const newPost = {
          id: 'post-' + Date.now(),
          userId: currentUser.id,
          title: title,
          desc: desc,
          location: location || 'Not Specified',
          category: category,
          severity: aiPriority,
          aiScore: aiPriority,
          aiCredibility: aiCred,
          likes: [],
          dislikes: [],
          votes: 0,
          voters: [],
          mediaUrl: composerMediaDataUrl,
          createdAt: new Date().toISOString()
        };

        const posts = window.getStoredPosts();
        posts.unshift(newPost);
        window.savePosts(posts);

        // Auto-seed monsoon emergency forecasts if critical
        if (aiPriority === 'Critical') {
          const alerts = window.getStoredAlerts();
          alerts.unshift({
            id: 'alert-' + Date.now(),
            title: 'New Emergency Reported: ' + title,
            desc: desc + ` (Location: ${newPost.location})`,
            criticality: 'Critical',
            createdAt: new Date().toISOString()
          });
          window.saveAlerts(alerts);
        }

        // Reset composer inputs
        document.getElementById('post-title').value = '';
        document.getElementById('post-desc').value = '';
        document.getElementById('post-location').value = '';
        document.getElementById('post-category').selectedIndex = 0;
        resetComposerMedia();

        triggerContainer.classList.remove('hidden');
        form.classList.add('hidden');
        
        refreshDashboard();
      });
    }

    if (mediaInput) {
      mediaInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
          composerMediaDataUrl = evt.target.result;
          const previewContainer = document.getElementById('media-preview-container');
          if (previewContainer) {
            previewContainer.classList.remove('hidden');
            previewContainer.innerHTML = `
              <div class="media-preview-card" style="margin-top: 10px; position:relative; display:inline-block;">
                <img src="${composerMediaDataUrl}" alt="Attachment preview" style="max-width: 120px; border-radius: 6px;" />
                <button class="remove-media-btn" id="btn-remove-media" style="position:absolute; top:-5px; right:-5px; background:#ef4444; border:none; color:#fff; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer;">✕</button>
              </div>
            `;
            document.getElementById('btn-remove-media').addEventListener('click', (ev) => {
              ev.preventDefault();
              resetComposerMedia();
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function resetComposerMedia() {
    composerMediaDataUrl = '';
    const previewContainer = document.getElementById('media-preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = '';
      previewContainer.classList.add('hidden');
    }
    const mediaInput = document.getElementById('composer-media-input');
    if (mediaInput) {
      mediaInput.value = '';
    }
  }

  function setupHeaderEvents() {
    // Logo Click Home Timeline Reset
    const logoHome = document.getElementById('header-logo-home');
    if (logoHome) {
      logoHome.addEventListener('click', () => {
        activeTimelineUserId = null;
        refreshDashboard();
      });
    }

    // Clear notifications click
    const clearNotificationsBtn = document.getElementById('clear-notifications-btn');
    if (clearNotificationsBtn) {
      clearNotificationsBtn.addEventListener('click', clearAllNotifications);
    }
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
    console.log("⚡ Received refresh-feed event, refreshing citizen dashboard...");
    refreshDashboard();
  });
})();
