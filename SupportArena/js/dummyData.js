// Preset database seed dummy data for SupportArena
(function() {
  const defaultUsers = [
    { 
      id: 'admin-1', 
      name: 'Admin Supervisor', 
      username: 'admin', 
      email: 'admin@example.com', 
      password: 'admin123', 
      role: 'admin', 
      location: 'City Hall',
      bio: 'Lead Dispatcher & Admin Supervisor at SupportArena Command Center.'
    },
    { 
      id: 'citizen-1', 
      name: 'Ahmad Ali', 
      username: 'ahmad_ali', 
      email: 'ahmad@example.com', 
      password: 'citizen123', 
      role: 'citizen', 
      location: 'Gulshan-e-Iqbal',
      bio: 'Civic advocate and resident of Gulshan-e-Iqbal, Karachi.'
    },
    { 
      id: 'citizen-2', 
      name: 'Sara Khan', 
      username: 'sara_khan', 
      email: 'sara@example.com', 
      password: 'citizen123', 
      role: 'citizen', 
      location: 'DHA Phase 5',
      bio: 'Active neighborhood safety monitor and clean water activist.'
    },
    { 
      id: 'citizen-3', 
      name: 'Muhammad Usman', 
      username: 'usman_m', 
      email: 'usman@example.com', 
      password: 'citizen123', 
      role: 'citizen', 
      location: 'Model Town',
      bio: 'Concerned citizen focused on municipal waste management and green spaces.'
    },
    { 
      id: 'citizen-4', 
      name: 'Zainab Fatima', 
      username: 'zainab_f', 
      email: 'zainab@example.com', 
      password: 'citizen123', 
      role: 'citizen', 
      location: 'Clifton',
      bio: 'Public health educator tracking urban sanitation and drainage concerns in Karachi.'
    },
    { 
      id: 'citizen-5', 
      name: 'Bilal Butt', 
      username: 'bilal_b', 
      email: 'bilal@example.com', 
      password: 'citizen123', 
      role: 'citizen', 
      location: 'Sector G-11',
      bio: 'Tech enthusiast and volunteer reporting civic infrastructural breakdowns in Islamabad.'
    }
  ];

  const defaultOrgs = [
    { 
      id: 'org-1', 
      name: 'WAPDA', 
      username: 'wapda_admin', 
      email: 'wapda@service.local', 
      password: 'wapda123', 
      role: 'organization', 
      type: 'Electric Utility', 
      area: 'National Power Grid',
      bio: 'Water and Power Development Authority of Pakistan.'
    },
    { 
      id: 'org-2', 
      name: 'Rescue 1122', 
      username: 'rescue1122', 
      email: 'rescue1122@service.local', 
      password: 'rescue123', 
      role: 'organization', 
      type: 'Emergency Rescue', 
      area: 'All Sectors',
      bio: 'Emergency services provider specializing in medical and trauma response.'
    },
    { 
      id: 'org-3', 
      name: 'Fire Brigade', 
      username: 'fire_brigade', 
      email: 'firebrigade@service.local', 
      password: 'fire123', 
      role: 'organization', 
      type: 'Municipal Fire Dept', 
      area: 'City Center',
      bio: 'City Municipal Fire and Emergency Response Service.'
    }
  ];

  const defaultPosts = [
    {
      id: 'post-1',
      userId: 'citizen-1',
      title: 'Unannounced 10-hour electricity load shedding in Gulberg Block L',
      desc: 'We are experiencing severe unannounced load shedding exceeding 10 hours daily in Gulberg Block L. The local power transformer exploded last night due to overload and extreme heat, leaving the entire block without water pump operations. WAPDA maintenance is requested immediately to replace the transformer.',
      location: 'Gulberg Block L, Lahore',
      category: 'Utilities',
      severity: 'High',
      aiScore: 'High',
      aiCredibility: 'Verified',
      votes: 14,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'post-2',
      userId: 'citizen-2',
      title: 'Contaminated sewage-mixed water supply in DHA Phase 5',
      desc: 'The clean tap water supply in DHA Phase 5 (specifically Street 12, Sector C) has been contaminated with sewage water. The water is highly turbid, muddy, and has a strong foul odor. This is a severe health hazard risking waterborne outbreaks. The municipal water authorities must isolate the sewage leak immediately.',
      location: 'Sector C, DHA Phase 5, Karachi',
      category: 'Infrastructure',
      severity: 'Critical',
      aiScore: 'Critical',
      aiCredibility: 'High Credibility',
      votes: 38,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 14).toISOString()
    },
    {
      id: 'post-3',
      userId: 'citizen-3',
      title: 'Total gas pressure drop during peak cooking hours in Model Town',
      desc: 'Sui Southern Gas pressure drops to absolute zero from 6:00 AM to 9:00 AM and 7:00 PM to 10:00 PM in Model Town Block A. Preparing meals for families has become impossible, forcing residents to use expensive LPG cylinders or electric stoves. We request SSGC to restore regular gas pressure.',
      location: 'Model Town Block A, Lahore',
      category: 'Utilities',
      severity: 'Medium',
      aiScore: 'Medium',
      aiCredibility: 'Likely',
      votes: 5,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'post-4',
      userId: 'citizen-4',
      title: 'Burst Sewage Main Spilling Raw Effluent on Main Boulevard, Clifton Block 5',
      desc: 'An underground sewage main pipe has burst near Clifton Block 5, flooding the main road with raw effluent. Stagnant sewage is breeding mosquitoes, creating an intolerable stench, and blocking access to local houses. KWSB is requested to deploy a high-pressure suction truck to clear the sewer blockage and repair the pipeline before disease spreads.',
      location: 'Clifton Block 5, Karachi',
      category: 'Infrastructure',
      severity: 'High',
      aiScore: 'High',
      aiCredibility: 'Verified',
      votes: 21,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
    },
    {
      id: 'post-5',
      userId: 'citizen-5',
      title: 'Open Manholes and Missing Sewer Covers on Khayaban-e-Ittehad',
      desc: 'Three open manholes are left completely exposed on the fast lane of Khayaban-e-Ittehad (near DHA Phase 6 intersection). With non-functional streetlights in the area, these open holes present an extreme hazard for motorists and motorcyclists at night. We need KMC to install new heavy-duty manhole covers immediately.',
      location: 'Khayaban-e-Ittehad, DHA Phase 6, Karachi',
      category: 'Safety',
      severity: 'Critical',
      aiScore: 'Critical',
      aiCredibility: 'Verified',
      votes: 45,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'post-6',
      userId: 'citizen-5',
      title: 'Municipal Water Supply Cutoff for 10 Days in Sector G-11/3',
      desc: 'CDA water supply has been completely dry for the past 10 days in Sector G-11/3. Residents are forced to purchase private water tankers at exorbitant rates (PKR 5,000 per tanker). CDA claims the local pump motor has burned out, but repair work has not commenced. Requesting urgent restoration.',
      location: 'Sector G-11/3, Islamabad',
      category: 'Utilities',
      severity: 'High',
      aiScore: 'High',
      aiCredibility: 'Likely',
      votes: 19,
      voters: [],
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  const defaultReplies = [
    {
      id: 'reply-1',
      postId: 'post-2',
      userId: 'admin-1',
      name: 'Admin Supervisor',
      role: 'admin',
      text: 'Critical health hazard detected. Alerting the Water and Sewage Board and CSN Safety network for urgent site inspection and testing.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'reply-2',
      postId: 'post-2',
      parentId: 'reply-1',
      userId: 'org-2',
      name: 'Rescue 1122',
      role: 'organization',
      text: 'Rescue 1122 safety inspector has been dispatched to coordinate with the water department crew. Isolating the pipe valves now.',
      createdAt: new Date(Date.now() - 3600000 * 11).toISOString()
    },
    {
      id: 'reply-3',
      postId: 'post-2',
      parentId: 'reply-2',
      userId: 'citizen-2',
      name: 'Sara Khan',
      role: 'citizen',
      text: 'Thank you, Rescue 1122! Please also check Street 14, the sewage smell is getting worse here.',
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
    },
    {
      id: 'reply-4',
      postId: 'post-5',
      userId: 'admin-1',
      name: 'Admin Supervisor',
      role: 'admin',
      text: 'Urgent public safety issue flagged. Dispatched emergency request to KMC and traffic police to place warning signs and barricades.',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    },
    {
      id: 'reply-5',
      postId: 'post-5',
      parentId: 'reply-4',
      userId: 'citizen-5',
      name: 'Bilal Butt',
      role: 'citizen',
      text: 'Confirming that a temporary red warning barrel has been placed by locals, but a permanent manhole cover is still needed.',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    // Comment history for post-1 (fully resolved)
    {
      id: 'reply-p1-1',
      postId: 'post-1',
      userId: 'admin-1',
      name: 'Admin Supervisor',
      role: 'admin',
      text: '🛠️ DISPATCHED: Handed over task to WAPDA. Instructions: "WAPDA maintenance is requested immediately to replace the exploded transformer in Gulberg Block L, Lahore."',
      createdAt: new Date(Date.now() - 3600000 * 23).toISOString()
    },
    {
      id: 'reply-p1-2',
      postId: 'post-1',
      userId: 'org-1',
      name: 'WAPDA',
      role: 'organization',
      text: '🔧 RESOLUTION SUBMITTED: "We have replaced the burned 200kVA transformer with a new 400kVA transformer to handle peak summer load. Water pump operations are fully operational." (Pending Admin Clearance)',
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: 'reply-p1-3',
      postId: 'post-1',
      userId: 'admin-1',
      name: 'Admin Supervisor',
      role: 'admin',
      text: '✅ DISPATCH CLEARED & RESOLVED: Admin approved resolution work by WAPDA. Final Feedback: "We have replaced the burned 200kVA transformer with a new 400kVA transformer to handle peak summer load. Water pump operations are fully operational."',
      createdAt: new Date(Date.now() - 3600000 * 19).toISOString()
    },
    // Comment history for post-2 (pending clearance)
    {
      id: 'reply-p2-4',
      postId: 'post-2',
      userId: 'admin-1',
      name: 'Admin Supervisor',
      role: 'admin',
      text: '🛠️ DISPATCHED: Handed over task to Rescue 1122. Instructions: "Provide clean water tankers and coordinate sewage valve isolation."',
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString()
    },
    {
      id: 'reply-p2-5',
      postId: 'post-2',
      userId: 'org-2',
      name: 'Rescue 1122',
      role: 'organization',
      text: '🔧 RESOLUTION SUBMITTED: "Rescue team has provided emergency clean water tankers. Sewage line is isolated; KWSB crew is working on pipeline repairs." (Pending Admin Clearance)',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ];

  const defaultDispatches = [
    {
      id: 'disp-101',
      postId: 'post-1',
      orgId: 'org-1',
      instructions: 'WAPDA maintenance is requested immediately to replace the exploded transformer in Gulberg Block L, Lahore.',
      status: 'Resolved',
      feedback: 'We have replaced the burned 200kVA transformer with a new 400kVA transformer to handle peak summer load. Water pump operations are fully operational.',
      createdAt: new Date(Date.now() - 3600000 * 23).toISOString()
    },
    {
      id: 'disp-102',
      postId: 'post-2',
      orgId: 'org-2',
      instructions: 'Provide clean water tankers and coordinate sewage valve isolation.',
      status: 'Pending Clearance',
      feedback: 'Rescue team has provided emergency clean water tankers. Sewage line is isolated; KWSB crew is working on pipeline repairs.',
      createdAt: new Date(Date.now() - 3600000 * 9).toISOString()
    }
  ];

  const defaultAlerts = [
    {
      id: 'alert-1',
      title: 'CRITICAL FORECAST',
      desc: 'Heavy monsoon rainfall predicted for Karachi starting June 14. Avoid low-lying streets and report water logging immediately.',
      criticality: 'Critical',
      createdAt: new Date().toISOString()
    }
  ];

  const defaultNotifications = [
    {
      id: 'notif-seed-1',
      userId: 'admin-1',
      title: 'Feedback Clearance Required',
      message: 'Agency Rescue 1122 submitted resolution feedback for: "Contaminated sewage-mixed water supply in DHA Phase 5"',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      dispatchId: 'disp-102',
      postId: 'post-2'
    },
    {
      id: 'notif-seed-2',
      userId: 'org-2',
      title: 'Feedback Submitted',
      message: 'Feedback for task "Contaminated sewage-mixed water supply in DHA Phase 5" submitted. Pending admin clearance.',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      dispatchId: 'disp-102',
      postId: 'post-2'
    }
  ];

  // Expose seed data loaders
  window.getDefaultUsers = () => defaultUsers;
  window.getDefaultOrgs = () => defaultOrgs;
  window.getDefaultPosts = () => defaultPosts;
  window.getDefaultReplies = () => defaultReplies;
  window.getDefaultDispatches = () => defaultDispatches;
  window.getDefaultAlerts = () => defaultAlerts;
  window.getDefaultNotifications = () => defaultNotifications;

  // Check and initialize local storage defaults
  window.seedDummyDatabase = (force = false) => {
    // Force reset dummy database if seeded before, to ensure the new accounts show up immediately
    const hasLoaded = localStorage.getItem('supportArena_pak_loaded9');
    if (!hasLoaded || force) {
      localStorage.setItem('supportArena_feed:users', JSON.stringify(defaultUsers));
      localStorage.setItem('supportArena_feed:orgs', JSON.stringify(defaultOrgs));
      localStorage.setItem('supportArena_feed:posts', JSON.stringify(defaultPosts));
      localStorage.setItem('supportArena_feed:replies', JSON.stringify(defaultReplies));
      localStorage.setItem('supportArena_feed:dispatches', JSON.stringify(defaultDispatches));
      localStorage.setItem('supportArena_feed:alerts', JSON.stringify(defaultAlerts));
      localStorage.setItem('supportArena_feed:notifications', JSON.stringify(defaultNotifications));
      localStorage.setItem('supportArena_pak_loaded9', 'true');
    }
  };
})();

