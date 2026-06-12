// Administrative controls, sidebar incident queues, task boards, and dispatches (Redesigned Slate theme version)
(function() {
  let activePriorityFilter = 'All';
  let pendingDispatchPostId = null;

  function initSeverityFilters(onChangeCallback) {
    const items = document.querySelectorAll('.severity-sidebar-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        items.forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activePriorityFilter = e.currentTarget.getAttribute('data-priority');
        if (typeof onChangeCallback === 'function') {
          onChangeCallback();
        }
      });
    });
  }

  function getActivePriorityFilter() {
    return activePriorityFilter;
  }

  // Intercept stored posts getter to apply active priority filters
  const originalGetStoredPosts = window.getStoredPosts;
  window.getStoredPosts = function() {
    let posts = originalGetStoredPosts ? originalGetStoredPosts() : [];
    if (activePriorityFilter !== 'All') {
      posts = posts.filter(p => p.aiScore === activePriorityFilter);
    }
    return posts;
  };

  // Sync count badges in the left sidebar severity queues card
  function updateSeverityQueuesCounts() {
    const posts = originalGetStoredPosts ? originalGetStoredPosts() : [];
    
    const countAll = posts.length;
    const countCrit = posts.filter(p => p.aiScore === 'Critical').length;
    const countHigh = posts.filter(p => p.aiScore === 'High').length;
    const countMed = posts.filter(p => p.aiScore === 'Medium').length;
    const countLow = posts.filter(p => p.aiScore === 'Low').length;

    const elAll = document.getElementById('count-all');
    const elCrit = document.getElementById('count-critical');
    const elHigh = document.getElementById('count-high');
    const elMed = document.getElementById('count-medium');
    const elLow = document.getElementById('count-low');

    if (elAll) elAll.textContent = countAll;
    if (elCrit) elCrit.textContent = countCrit;
    if (elHigh) elHigh.textContent = elHigh.parentElement.classList.contains('hidden') ? '0' : countHigh;
    if (elMed) elMed.textContent = countMed;
    if (elLow) elLow.textContent = countLow;
  }

  function renderDashboardPanels(user, priorityFilter) {
    // 1. Update severity queue counts
    updateSeverityQueuesCounts();

    // 2. Render AI Critical incident Queue (Critical & High priority issues)
    const aiQueueList = document.getElementById('ai-critical-queue-list');
    if (aiQueueList) {
      const posts = originalGetStoredPosts ? originalGetStoredPosts() : [];
      const criticalPosts = posts.filter(p => p.aiScore === 'Critical' || p.aiScore === 'High');
      
      if (criticalPosts.length === 0) {
        aiQueueList.innerHTML = `<p class="empty-list" style="font-size:0.75rem;">No critical alarms reported.</p>`;
      } else {
        aiQueueList.innerHTML = criticalPosts.map(post => `
          <div class="ai-queue-item">
            <p class="title">${post.title}</p>
            <div class="ai-queue-item-meta">
              <span>📍 ${post.location}</span>
              <span class="ai-priority-badge ${post.aiScore.toLowerCase()}" style="font-size:0.65rem; padding: 2px 6px;">${post.aiScore}</span>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. Toggle roles containers
    const severityCard = document.getElementById('severity-filter-card');
    const aiQueueCard = document.getElementById('ai-queue-card');
    const dispatchBox = document.getElementById('right-sidebar-dispatch-box');
    const orgTaskboardCard = document.getElementById('org-taskboard-card');
    const citizenNotifCard = document.getElementById('citizen-notifications-card');

    if (user.role === 'admin') {
      severityCard.classList.remove('hidden');
      aiQueueCard.classList.remove('hidden');
      dispatchBox.classList.remove('hidden');
      orgTaskboardCard.classList.add('hidden');
      citizenNotifCard.classList.add('hidden');
      
      // Render standard active help dispatches
      renderRightSidebarDispatchesBox(user);
    } else if (user.role === 'organization') {
      severityCard.classList.add('hidden');
      aiQueueCard.classList.add('hidden');
      dispatchBox.classList.add('hidden');
      orgTaskboardCard.classList.remove('hidden');
      citizenNotifCard.classList.add('hidden');
      
      renderOrganizationTaskboard(user);
    } else {
      // Citizen
      severityCard.classList.add('hidden');
      aiQueueCard.classList.add('hidden');
      dispatchBox.classList.add('hidden');
      orgTaskboardCard.classList.add('hidden');
      citizenNotifCard.classList.remove('hidden');
      
      if (typeof window.renderNotificationsPanel === 'function') {
        window.renderNotificationsPanel(user);
      }
    }
  }

  // Renders the normal listing of active dispatches in the admin dashboard (Right sidebar)
  function renderRightSidebarDispatchesBox(user) {
    const box = document.getElementById('right-sidebar-dispatch-box');
    if (!box) return;

    // If we are currently in the middle of dispatching a task, render the Dispatch Task Form
    if (pendingDispatchPostId) {
      const post = (originalGetStoredPosts ? originalGetStoredPosts() : []).find(p => p.id === pendingDispatchPostId);
      const orgs = window.getStoredOrgs();
      
      box.innerHTML = `
        <div class="dispatch-widget-card">
          <h3>Dispatch Task</h3>
          <p class="subtitle" style="margin-bottom:8px;">Assigning issue to a municipal responder</p>
          
          <div>
            <label style="font-weight:700; font-size:0.75rem; color:var(--text-light);">Post Title</label>
            <p style="font-size:0.85rem; font-weight:600; margin-top:2px; color:var(--text);">${post ? post.title : 'Loading...'}</p>
          </div>
          
          <div style="margin-top:8px;">
            <label for="dispatch-org-select">Select Agency</label>
            <select id="dispatch-org-select" style="margin-top:4px; padding: 8px;">
              <option value="">-- Select Agency --</option>
              ${orgs.map(o => `<option value="${o.id}">${o.name} (${o.type} - Area: ${o.area})</option>`).join('')}
            </select>
          </div>
          
          <div style="margin-top:8px;">
            <label for="dispatch-instructions">Instructions</label>
            <textarea id="dispatch-instructions" rows="3" placeholder="Instructions for the crew..." style="margin-top:4px; padding: 8px; font-size:0.8rem;"></textarea>
          </div>
          
          <div style="display:flex; justify-content:space-between; margin-top:8px; gap:8px;">
            <button class="secondary small" id="dispatch-cancel-btn" style="flex:1;">Cancel</button>
            <button class="primary small" id="dispatch-submit-btn" style="flex:1;">Dispatch</button>
          </div>
        </div>
      `;

      document.getElementById('dispatch-cancel-btn').addEventListener('click', cancelDispatch);
      document.getElementById('dispatch-submit-btn').addEventListener('click', () => {
        submitDispatch(user, () => {
          // Re-render feed and dispatches
          if (typeof window.renderFeed === 'function') window.renderFeed(user);
          renderDashboardPanels(user, activePriorityFilter);
        });
      });
    } else {
      // Render the standard dispatches listing
      const dispatches = window.getStoredDispatches();
      const orgs = window.getStoredOrgs();

      let dispatchesHtml = '';
      if (dispatches.length === 0) {
        dispatchesHtml = `<p class="empty-list" style="font-size:0.75rem;">No active agency dispatches.</p>`;
      } else {
        dispatchesHtml = dispatches.map(d => {
          const post = (originalGetStoredPosts ? originalGetStoredPosts() : []).find(p => p.id === d.postId) || { title: 'Unknown Issue' };
          const org = orgs.find(o => o.id === d.orgId) || { name: 'Unknown Responder' };
          let statusClass = d.status.toLowerCase().replace(' ', '-');
          
          return `
            <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding-left: 8px;">
              <div class="ai-queue-item-meta">
                <strong>${org.name}</strong>
                <span class="disp-status ${statusClass}" style="font-size:0.65rem; padding: 2px 6px; font-weight:700; border-radius:4px; background: rgba(59,130,246,0.1); color: var(--primary);">${d.status}</span>
              </div>
              <p style="font-size:0.75rem; margin-top:4px;">Issue: ${post.title}</p>
              ${d.feedback ? `<p style="font-size:0.7rem; color:var(--success); font-style:italic; margin-top:2px;">💬 Feed: ${d.feedback}</p>` : ''}
            </div>
          `;
        }).join('');
      }

      box.innerHTML = `
        <div class="right-sidebar-panel" id="dispatches-card">
          <h3>📬 Active Help Dispatches</h3>
          <div class="ai-queue-list">
            ${dispatchesHtml}
          </div>
        </div>
      `;
    }
  }

  // Opens the sidebar dispatch task form
  function openDispatchWidget(postId) {
    pendingDispatchPostId = postId;
    const user = window.currentUser;
    if (user) {
      renderRightSidebarDispatchesBox(user);
    }
  }

  function submitDispatch(adminUser, onSuccess) {
    const orgId = document.getElementById('dispatch-org-select').value;
    const instructions = document.getElementById('dispatch-instructions').value.trim();

    if (!orgId || !instructions) {
      alert('Please select an organization and enter dispatch instructions.');
      return;
    }

    const newDispatch = {
      id: 'disp-' + Date.now(),
      postId: pendingDispatchPostId,
      orgId: orgId,
      instructions: instructions,
      status: 'In Progress',
      feedback: '',
      createdAt: new Date().toISOString()
    };

    const dispatches = window.getStoredDispatches();
    dispatches.push(newDispatch);
    window.saveDispatches(dispatches);

    // Send notifications to poster
    const post = (originalGetStoredPosts ? originalGetStoredPosts() : []).find(p => p.id === pendingDispatchPostId);
    const org = window.getStoredOrgs().find(o => o.id === orgId);
    if (post && org) {
      const notifs = window.getStoredNotifications();
      notifs.unshift({
        id: 'notif-' + Date.now(),
        userId: post.userId,
        title: 'Dispatch Initiated',
        message: `Your report "${post.title}" has been dispatched to ${org.name} for inspection.`,
        read: false,
        createdAt: new Date().toISOString()
      });
      window.saveNotifications(notifs);

      // Auto-reply comment to the timeline post
      const replies = window.getStoredReplies();
      replies.push({
        id: 'rep-' + Date.now(),
        postId: post.id,
        userId: adminUser.id,
        name: adminUser.name,
        role: 'admin',
        text: `🛠️ DISPATCHED: Handed over task to ${org.name}. Instructions: "${instructions}"`,
        createdAt: new Date().toISOString()
      });
      window.saveReplies(replies);
    }

    cancelDispatch();
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  }

  function cancelDispatch() {
    pendingDispatchPostId = null;
    const user = window.currentUser;
    if (user) {
      renderRightSidebarDispatchesBox(user);
    }
  }

  // Renders the tasks list for the logged-in organization
  function renderOrganizationTaskboard(org) {
    const taskContainer = document.getElementById('org-tasks-list');
    if (!taskContainer) return;

    const dispatches = window.getStoredDispatches().filter(d => d.orgId === org.id);

    if (dispatches.length === 0) {
      taskContainer.innerHTML = `<p class="empty-list" style="font-size:0.75rem;">No active assignments. Waiting for dispatches.</p>`;
      return;
    }

    taskContainer.innerHTML = dispatches.map(d => {
      const post = (originalGetStoredPosts ? originalGetStoredPosts() : []).find(p => p.id === d.postId) || { title: 'Deleted Issue' };
      let statusClass = d.status.toLowerCase().replace(' ', '-');

      let actionButtons = '';
      if (d.status === 'In Progress') {
        actionButtons = `
          <button class="primary small btn-complete-task" data-disp-id="${d.id}" style="margin-top: 8px; width: 100%; justify-content: center; font-size: 0.75rem; padding: 6px;">Mark Resolved</button>
        `;
      }

      return `
        <div class="ai-queue-item" style="border-left: 3px solid var(--primary); padding-left: 8px; display: flex; flex-direction: column; gap: 4px;">
          <div class="ai-queue-item-meta">
            <strong>Task #${d.id.split('-')[1] || '1'}</strong>
            <span class="disp-status ${statusClass}" style="font-size:0.65rem; padding: 2px 6px; font-weight:700; border-radius:4px; background: rgba(59,130,246,0.1); color: var(--primary);">${d.status}</span>
          </div>
          <p style="font-size: 0.8rem; font-weight: 600; margin-top: 4px;">Issue: ${post.title}</p>
          <p style="font-size: 0.75rem; color: var(--text-light);">Instructions: ${d.instructions}</p>
          ${d.feedback ? `<p style="font-size: 0.75rem; color: var(--success); font-style: italic;">Your Feedback: ${d.feedback}</p>` : ''}
          ${actionButtons}
        </div>
      `;
    }).join('');

    // Bind mark resolved trigger
    taskContainer.querySelectorAll('.btn-complete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dispId = e.currentTarget.getAttribute('data-disp-id');
        const feedback = prompt("Enter resolution feedback for citizens and admin:");
        if (feedback !== null && feedback.trim() !== '') {
          const allDispatches = window.getStoredDispatches();
          const dIdx = allDispatches.findIndex(d => d.id === dispId);
          if (dIdx !== -1) {
            allDispatches[dIdx].status = 'Resolved';
            allDispatches[dIdx].feedback = feedback.trim();
            window.saveDispatches(allDispatches);

            // Notify citizen
            const posts = originalGetStoredPosts ? originalGetStoredPosts() : [];
            const post = posts.find(p => p.id === allDispatches[dIdx].postId);
            if (post) {
              const notifs = window.getStoredNotifications();
              notifs.unshift({
                id: 'notif-' + Date.now(),
                userId: post.userId,
                title: 'Issue Resolved!',
                message: `Your report "${post.title}" has been marked as resolved by ${org.name}. Feedback: "${feedback.trim()}"`,
                read: false,
                createdAt: new Date().toISOString()
              });
              window.saveNotifications(notifs);

              // Auto-reply feedback comment on the timeline post
              const replies = window.getStoredReplies();
              replies.push({
                id: 'rep-' + Date.now(),
                postId: post.id,
                userId: org.id,
                name: org.name,
                role: 'organization',
                text: `✅ RESOLVED: ${feedback.trim()}`,
                createdAt: new Date().toISOString()
              });
              window.saveReplies(replies);
            }

            if (typeof window.refreshDashboard === 'function') {
              window.refreshDashboard();
            }
          }
        }
      });
    });
  }

  // Expose admin functions
  window.renderAdminPriorityFilters = (onChangeCallback) => {
    initSeverityFilters(onChangeCallback);
  };
  window.getActivePriorityFilter = getActivePriorityFilter;
  window.renderDashboardPanels = renderDashboardPanels;
  window.openDispatchWidget = openDispatchWidget;
  window.submitDispatch = submitDispatch;
  window.cancelDispatch = cancelDispatch;
})();
