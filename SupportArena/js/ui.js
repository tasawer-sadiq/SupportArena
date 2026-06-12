// UI rendering controller for SupportArena (Redesigned Slate theme version)
(function() {
  let activeTimelineUserId = null;
  let composerMediaDataUrl = '';
  const expandedPosts = new Set(); // Track which posts have replies expanded

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

  function handleComposerMediaUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      composerMediaDataUrl = e.target.result;
      const previewContainer = document.getElementById('media-preview-container');
      if (previewContainer) {
        previewContainer.classList.remove('hidden');
        previewContainer.innerHTML = `
          <div class="media-preview-card" style="margin-top: 10px;">
            <img src="${composerMediaDataUrl}" alt="Attachment preview" style="max-width: 100px; border-radius: 6px;" />
            <button class="remove-media-btn" onclick="window.resetComposerMedia()">✕</button>
          </div>
        `;
      }
    };
    reader.readAsDataURL(file);
  }

  function filterTimelineByUserId(userId) {
    activeTimelineUserId = userId;
  }

  let cachedOnProfileChanged = null;
  let cachedOnSelectOwnTimeline = null;

  function renderProfileCard(profileUser, onProfileChanged, onSelectOwnTimeline, isViewingOtherUser = false) {
    if (onProfileChanged) cachedOnProfileChanged = onProfileChanged;
    if (onSelectOwnTimeline) cachedOnSelectOwnTimeline = onSelectOwnTimeline;

    const container = document.getElementById('profile-card-container');
    if (!container) return;

    const initials = profileUser.name ? profileUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    const bioText = profileUser.bio || 'Civic advocate and SupportArena contributor.';

    let profileActionsHtml = '';
    let logoutBtnHtml = '';

    if (!isViewingOtherUser) {
      // Viewing own profile
      let timelineBtn = '';
      if (profileUser.role === 'citizen') {
        timelineBtn = `<button class="small secondary" id="btn-my-posts" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; padding: 10px 16px; margin-bottom: 8px; border-radius: 8px; font-weight: 600;">📄 View My Posts</button>`;
      }
      
      profileActionsHtml = `
        <div class="profile-actions" style="display: flex; flex-direction: column; width: 100%; margin-top: 16px;">
          ${timelineBtn}
          <button class="small secondary" id="btn-edit-profile" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; padding: 10px 16px; border-radius: 8px; font-weight: 600;">⚙️ Edit Profile</button>
        </div>
      `;

      logoutBtnHtml = `
        <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; width: 100%;">
          <button class="primary" id="btn-profile-logout" style="width: 100%; justify-content: center; background: #ef4444; border: none; font-size: 0.9rem; padding: 10px 16px; border-radius: 8px; font-weight: 700; color: #fff;">Logout</button>
        </div>
      `;
    } else {
      // Viewing another citizen's profile
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
          <h4 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: #fff; font-family: 'Outfit', sans-serif;">${profileUser.name}</h4>
          <span class="profile-username" style="display: block; font-size: 0.85rem; color: var(--text-light); margin-bottom: 4px;">@${profileUser.username || 'user'}</span>
          <span class="profile-email" style="display: block; font-size: 0.85rem; color: var(--text-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 12px; font-family: monospace;">${profileUser.email}</span>
          <p class="profile-bio" style="font-size: 0.85rem; color: var(--text-light); line-height: 1.4; margin-top: 12px;">${bioText}</p>
        </div>
        ${profileActionsHtml}
        
        <div id="profile-edit-panel" class="profile-edit-panel hidden" style="width: 100%; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px; text-align: left;">
          <label for="edit-profile-name" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-light); margin-bottom:4px;">Display Name</label>
          <input type="text" id="edit-profile-name" value="${profileUser.name}" placeholder="Name" style="margin-bottom: 12px; padding: 8px 12px; font-size: 0.85rem;" />
          <button class="small primary" id="btn-save-profile" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 8px 12px;">Save Name</button>
          <div style="border-top: 1px solid var(--border); margin-top: 12px; padding-top: 12px; width: 100%;">
            <button class="small secondary text-danger" id="btn-delete-profile" style="width: 100%; justify-content: center; border-color: var(--danger); font-size: 0.85rem; padding: 8px 12px;">⚠️ Delete Account</button>
          </div>
        </div>
        
        ${logoutBtnHtml}
      </div>
    `;

    // Bind event handlers
    if (!isViewingOtherUser) {
      if (profileUser.role === 'citizen') {
        document.getElementById('btn-my-posts').addEventListener('click', () => {
          if (typeof cachedOnSelectOwnTimeline === 'function') {
            cachedOnSelectOwnTimeline(profileUser.id);
          }
        });
      }

      const editPanel = document.getElementById('profile-edit-panel');
      document.getElementById('btn-edit-profile').addEventListener('click', () => {
        editPanel.classList.toggle('hidden');
      });

      document.getElementById('btn-profile-logout').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('app-logout'));
      });

      document.getElementById('btn-save-profile').addEventListener('click', () => {
        const newName = document.getElementById('edit-profile-name').value.trim();
        if (!newName) return;
        profileUser.name = newName;
        
        if (profileUser.role === 'organization') {
          const orgs = window.getStoredOrgs();
          const idx = orgs.findIndex(o => o.id === profileUser.id);
          if (idx !== -1) {
            orgs[idx].name = newName;
            window.saveOrgs(orgs);
          }
        } else {
          const users = window.getStoredUsers();
          const idx = users.findIndex(u => u.id === profileUser.id);
          if (idx !== -1) {
            users[idx].name = newName;
            window.saveUsers(users);
          }
        }
        editPanel.classList.add('hidden');
        if (typeof cachedOnProfileChanged === 'function') {
          cachedOnProfileChanged(profileUser);
        }
      });

      const btnDeleteProfile = document.getElementById('btn-delete-profile');
      if (btnDeleteProfile) {
        btnDeleteProfile.addEventListener('click', async () => {
          const confirm1 = confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
          if (confirm1) {
            const confirm2 = confirm("Confirming again: Delete account for " + profileUser.email + "? All your local and online records will be purged.");
            if (confirm2) {
              btnDeleteProfile.disabled = true;
              btnDeleteProfile.textContent = 'Deleting Account...';
              try {
                if (typeof window.deleteUserAccount === 'function') {
                  await window.deleteUserAccount(profileUser.id, profileUser.role, profileUser.email);
                }
                alert("Your account has been deleted successfully.");
                document.dispatchEvent(new CustomEvent('app-logout'));
              } catch (err) {
                alert("Error deleting account: " + err.message);
                btnDeleteProfile.disabled = false;
                btnDeleteProfile.textContent = '⚠️ Delete Account';
              }
            }
          }
        });
      }
    } else {
      document.getElementById('btn-back-to-own-profile').addEventListener('click', () => {
        // Clear filter
        window.filterTimelineByUserId(null);
        // Re-render dashboard profile card (using current logged in user)
        renderProfileCard(window.currentUser, cachedOnProfileChanged, cachedOnSelectOwnTimeline, false);
        // Re-render feed
        window.renderFeed(window.currentUser);
      });
    }
  }

  function renderUpcomingAlertBanner(user, onAlertUpdateCallback) {
    const container = document.getElementById('alert-banner-container');
    if (!container) return;

    const alerts = window.getStoredAlerts();
    if (alerts.length === 0) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    const alert = alerts[0];
    
    let adminAlertControls = '';
    if (user.role === 'admin') {
      adminAlertControls = `
        <button class="small secondary" id="btn-edit-alert" style="border-radius: 6px; padding: 4px 10px; font-size: 0.75rem;">✏️ Edit Alert</button>
      `;
    }

    container.innerHTML = `
      <div class="alert-banner ${alert.criticality.toLowerCase()}">
        <div class="alert-content">
          <span class="alert-badge">⚡ MOST CRITICAL UPCOMING ISSUE</span>
          <strong>${alert.criticality.toUpperCase()} FORECAST:</strong> ${alert.desc}
        </div>
        ${adminAlertControls}
      </div>
      <div id="alert-edit-panel" class="alert-edit-panel card hidden" style="margin-bottom: 20px; border-radius: 8px;">
        <label>Alert Message Description</label>
        <textarea id="edit-alert-desc" rows="2" style="margin-bottom: 10px;">${alert.desc}</textarea>
        <label>Criticality Level</label>
        <select id="edit-alert-crit" style="margin-bottom: 12px;">
          <option ${alert.criticality === 'Low' ? 'selected' : ''}>Low</option>
          <option ${alert.criticality === 'Medium' ? 'selected' : ''}>Medium</option>
          <option ${alert.criticality === 'High' ? 'selected' : ''}>High</option>
          <option ${alert.criticality === 'Critical' ? 'selected' : ''}>Critical</option>
        </select>
        <div style="display: flex; gap: 8px;">
          <button class="small primary" id="btn-save-alert">Update Alert</button>
          <button class="small secondary" id="btn-delete-alert">Remove Alert</button>
        </div>
      </div>
    `;

    if (user.role === 'admin') {
      const editPanel = document.getElementById('alert-edit-panel');
      document.getElementById('btn-edit-alert').addEventListener('click', () => {
        editPanel.classList.toggle('hidden');
      });

      document.getElementById('btn-save-alert').addEventListener('click', () => {
        alert.desc = document.getElementById('edit-alert-desc').value.trim();
        alert.criticality = document.getElementById('edit-alert-crit').value;
        const currentAlerts = window.getStoredAlerts();
        currentAlerts[0] = alert;
        window.saveAlerts(currentAlerts);
        if (typeof onAlertUpdateCallback === 'function') {
          onAlertUpdateCallback();
        }
      });

      document.getElementById('btn-delete-alert').addEventListener('click', () => {
        window.saveAlerts([]);
        if (typeof onAlertUpdateCallback === 'function') {
          onAlertUpdateCallback();
        }
      });
    }
  }

  function renderFeed(user) {
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
      
      // Inline media content
      let mediaHtml = '';
      if (post.mediaUrl) {
        mediaHtml = `<div class="post-media-attachment"><img src="${post.mediaUrl}" alt="Attached media" /></div>`;
      }

      // Render replies list if expanded (Recursive Tree Generation for Reddit-style threads)
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
              <div class="comment-card" style="position: relative; padding: 10px 14px; background: #0b0f19; border: 1px solid var(--border); border-radius: 8px;">
                <div class="comment-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div class="comment-user-info btn-view-profile" data-creator-id="${reply.userId}" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <div class="comment-avatar" style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">${repInitials}</div>
                    <strong class="comment-name" style="font-size: 0.8rem; font-weight: 700;">${reply.name}</strong>
                    <span class="comment-role-tag ${roleBadgeClass}" style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px;">${reply.role}</span>
                  </div>
                  <span class="comment-time" style="font-size: 0.7rem; color: var(--text-light);">${new Date(reply.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p class="comment-text" style="font-size: 0.82rem; line-height: 1.4;">${reply.text}</p>
                
                <div class="comment-actions" style="margin-top: 6px; display: flex; gap: 12px; font-size: 0.75rem;">
                  <span class="btn-reply-to-comment" data-post-id="${post.id}" data-comment-id="${reply.id}" style="cursor: pointer; font-weight: 600; color: var(--primary); display: inline-flex; align-items: center; gap: 4px; hover: underline;">💬 Reply</span>
                </div>
                
                <!-- Inline nested reply composer -->
                <div class="inline-comment-composer hidden" id="composer-comment-${reply.id}" style="margin-top: 10px; display: flex; gap: 8px;">
                  <input type="text" id="input-comment-${reply.id}" placeholder="Reply to ${reply.name}..." style="flex: 1; border-radius: 20px; padding: 6px 14px; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: #fff;" />
                  <button class="primary small btn-comment-submit-nested" data-post-id="${post.id}" data-parent-id="${reply.id}">Reply</button>
                </div>
              </div>
              
              ${childReplies.length > 0 ? `
                <div class="comment-children" style="margin-left: 20px; border-left: 2px solid var(--border); padding-left: 12px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
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
              <input type="text" id="comment-input-${post.id}" placeholder="Write a civic statement..." style="flex: 1; border-radius: 20px; padding: 6px 14px; font-size: 0.8rem;" />
              <button class="primary small btn-comment-submit" data-post-id="${post.id}">Reply</button>
            </div>
          </div>
        `;
      }

      // Post ownership actions (edit / delete)
      let ownershipActions = '';
      if (post.userId === user.id) {
        ownershipActions = `
          <div style="display: flex; gap: 8px;">
            <button class="secondary small btn-edit-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--warning); color: var(--warning);">✏️ Edit</button>
            <button class="secondary small btn-delete-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">🗑️ Delete</button>
          </div>
        `;
      } else if (user.role === 'admin') {
        // Admin can delete any post to moderate the dashboard
        ownershipActions = `
          <button class="secondary small btn-delete-post" data-post-id="${post.id}" style="padding: 4px 10px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">Delete</button>
        `;
      }

      // Admin actions (Dispatch button inside center feed column)
      let adminDispatchBtn = '';
      if (user.role === 'admin') {
        const dispatches = window.getStoredDispatches();
        const activeDispatch = dispatches.find(d => d.postId === post.id);
        
        if (activeDispatch) {
          const dispatchedOrg = window.getStoredOrgs().find(o => o.id === activeDispatch.orgId);
          adminDispatchBtn = `
            <span class="dispatch-badge active" style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
              🔧 Dispatched: ${dispatchedOrg ? dispatchedOrg.name : 'Agency'} (${activeDispatch.status})
            </span>
          `;
        } else {
          adminDispatchBtn = `
            <button class="secondary small btn-dispatch-trigger" data-post-id="${post.id}">🛠️ Dispatch Organization</button>
          `;
        }
      }

      const toggleText = isExpanded ? `Hide Replies (${replies.length})` : `Show Replies (${replies.length})`;
      const toggleArrow = isExpanded ? '▲' : '▼';

      return `
        <div class="post-card card" id="post-card-${post.id}">
          <div class="post-header">
            <div class="post-user-meta btn-view-profile" data-creator-id="${post.userId}" style="cursor: pointer; display: flex; align-items: center; gap: 10px;">
              <div class="post-user-avatar">${initials}</div>
              <div>
                <strong class="post-creator-name">${creator.name}</strong>
                <span class="post-username">@${creator.username} • ${creator.role.toUpperCase()}</span>
              </div>
            </div>
            ${ownershipActions}
          </div>
          
          <div class="post-location-pill">📍 ${post.location.toUpperCase()}</div>
          
          <div class="post-category-meta">
            <span class="category-chip">${post.category.toUpperCase()}</span>
            <span class="ai-priority-badge ${post.aiScore.toLowerCase()}">AI VERDICT: ${post.aiScore.toUpperCase()}</span>
            <span class="ai-cred-badge" style="font-size: 0.7rem; padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: var(--text-light);">Credibility: ${post.aiCredibility}</span>
          </div>

          <h3 class="post-title">${post.title}</h3>
          <p class="post-description">${post.desc}</p>
          
          ${mediaHtml}
          
          <div class="post-footer">
            <button class="secondary small btn-upvote" data-post-id="${post.id}" style="padding: 6px 12px; font-size: 0.8rem;">
              ▲ Upvote (${post.votes || 0})
            </button>
            ${adminDispatchBtn}
            <div class="show-replies-link" data-post-id="${post.id}">
              💬 ${toggleText} ${toggleArrow}
            </div>
          </div>

          ${repliesHtml}
        </div>
      `;
    }).join('');

    attachTimelineEventHandlers(user);
  }

  function attachTimelineEventHandlers(user) {
    // Upvotes
    document.querySelectorAll('.btn-upvote').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
          if (!post.voters) post.voters = [];
          if (post.voters.includes(user.id)) {
            post.voters = post.voters.filter(id => id !== user.id);
            post.votes = (post.votes || 1) - 1;
          } else {
            post.voters.push(user.id);
            post.votes = (post.votes || 0) + 1;
          }
          window.savePosts(posts);
          renderFeed(user);
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
        renderFeed(user);
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
            if (typeof window.analyzeAICriticality === 'function') {
              post.aiScore = window.analyzeAICriticality(post.title, post.desc);
            }
            window.savePosts(posts);
            renderFeed(user);
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
          
          if (typeof window.deleteFromFirestore === 'function') {
            window.deleteFromFirestore('posts', postId);
          }
          renderFeed(user);
          
          // Refresh admin sidebar dispatches count
          if (typeof window.renderDashboardPanels === 'function') {
            window.renderDashboardPanels(user, window.getActivePriorityFilter ? window.getActivePriorityFilter() : 'All');
          }
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

        const roleText = user.role === 'admin' ? 'admin' : user.role === 'citizen' ? 'citizen' : 'organization';

        const newReply = {
          id: 'rep-' + Date.now(),
          postId: postId,
          userId: user.id,
          name: user.name,
          role: roleText,
          text: text,
          createdAt: new Date().toISOString()
        };

        const replies = window.getStoredReplies();
        replies.push(newReply);
        window.saveReplies(replies);
        
        // Push notification if this is a reply to someone else's post
        const posts = window.getStoredPosts();
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== user.id) {
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: post.userId,
            title: 'New Reply Received',
            message: `User ${user.name} replied: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
            read: false,
            createdAt: new Date().toISOString()
          });
          window.saveNotifications(notifications);
        }

        input.value = '';
        renderFeed(user);
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

        const roleText = user.role === 'admin' ? 'admin' : user.role === 'citizen' ? 'citizen' : 'organization';

        const newReply = {
          id: 'rep-' + Date.now(),
          postId: postId,
          parentId: parentId,
          userId: user.id,
          name: user.name,
          role: roleText,
          text: text,
          createdAt: new Date().toISOString()
        };

        const replies = window.getStoredReplies();
        replies.push(newReply);
        window.saveReplies(replies);

        // Notify parent comment creator
        const parentComment = replies.find(r => r.id === parentId);
        const targetUserId = parentComment ? parentComment.userId : null;

        if (targetUserId && targetUserId !== user.id) {
          const notifications = window.getStoredNotifications();
          notifications.unshift({
            id: 'notif-' + Date.now(),
            userId: targetUserId,
            title: 'New Thread Reply',
            message: `User ${user.name} replied to your statement: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
            read: false,
            createdAt: new Date().toISOString()
          });
          window.saveNotifications(notifications);
        }

        input.value = '';
        renderFeed(user);
      });
    });

    // Click on creator's name/avatar to view their profile and filter posts
    document.querySelectorAll('.btn-view-profile').forEach(element => {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        const creatorId = e.currentTarget.getAttribute('data-creator-id');
        let targetUser = window.getStoredUsers().find(u => u.id === creatorId);
        if (!targetUser) targetUser = window.getStoredOrgs().find(o => o.id === creatorId);
        
        if (targetUser) {
          const isOwn = targetUser.id === user.id;
          window.filterTimelineByUserId(isOwn ? null : targetUser.id);
          window.renderProfileCard(targetUser, cachedOnProfileChanged, cachedOnSelectOwnTimeline, !isOwn);
          window.renderFeed(user);
        }
      });
    });

    // Trigger Admin Dispatch Form panel inside Right Sidebar
    document.querySelectorAll('.btn-dispatch-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.currentTarget.getAttribute('data-post-id');
        if (typeof window.openDispatchWidget === 'function') {
          window.openDispatchWidget(postId);
        }
      });
    });
  }

  function submitNewPost(user, onSuccess) {
    const title = document.getElementById('post-title').value.trim();
    const desc = document.getElementById('post-desc').value.trim();
    const location = document.getElementById('post-location').value.trim();
    const category = document.getElementById('post-category').value;

    if (!title || !desc) {
      alert('Please fill out the Title and Description fields.');
      return;
    }

    const aiPriority = window.analyzeAICriticality(title, desc);
    const credibilityLevels = ['Verified', 'High Credibility', 'Likely', 'Pending Verification'];
    const aiCred = (aiPriority === 'Critical' || aiPriority === 'High') ? 'Verified' : credibilityLevels[Math.floor(Math.random() * credibilityLevels.length)];

    const newPost = {
      id: 'post-' + Date.now(),
      userId: user.id,
      title: title,
      desc: desc,
      location: location || 'Not Specified',
      category: category,
      severity: aiPriority,
      aiScore: aiPriority,
      aiCredibility: aiCred,
      votes: 0,
      voters: [],
      mediaUrl: composerMediaDataUrl,
      createdAt: new Date().toISOString()
    };

    const posts = window.getStoredPosts();
    posts.unshift(newPost);
    window.savePosts(posts);

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

    resetComposerMedia();
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  }

  function renderNotificationsPanel(user) {
    const listContainer = document.getElementById('notifications-list-container');
    if (!listContainer) return;

    const notifs = window.getStoredNotifications().filter(n => n.userId === user.id);
    
    if (notifs.length === 0) {
      listContainer.innerHTML = `<p class="empty-notif-msg">No reply alerts. You will be notified here when others reply to your posts.</p>`;
      return;
    }

    listContainer.innerHTML = notifs.map(n => `
      <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding-left: 8px;">
        <div class="ai-queue-item-meta">
          <strong>${n.title}</strong>
          <span>${new Date(n.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <p style="font-size: 0.75rem; margin-top: 4px;">${n.message}</p>
      </div>
    `).join('');
  }

  function clearAllCitizenNotifications(user) {
    const allNotifs = window.getStoredNotifications().filter(n => n.userId !== user.id);
    window.saveNotifications(allNotifs);
    renderNotificationsPanel(user);
  }

  // Expose functions globally
  window.resetComposerMedia = resetComposerMedia;
  window.handleComposerMediaUpload = handleComposerMediaUpload;
  window.filterTimelineByUserId = filterTimelineByUserId;
  window.renderProfileCard = renderProfileCard;
  window.renderUpcomingAlertBanner = renderUpcomingAlertBanner;
  window.renderFeed = renderFeed;
  window.submitNewPost = submitNewPost;
  window.clearAllCitizenNotifications = clearAllCitizenNotifications;
  window.renderNotificationsPanel = renderNotificationsPanel;
})();
