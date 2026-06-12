# 🏛️ SupportArena (Prototype Workspace)
> **Interactive Live Prototype for AI-Powered Civic Action**
> 
> *This workspace contains the working frontend prototype demonstrating user workflows, dual-mode synchronization, and the Gemini API AI engine for the SupportArena platform.*

---

## 🌟 Prototype Capabilities

SupportArena showcases the end-to-end user experience of CivicConnect in an interactive, responsive web dashboard. It highlights three interconnected dashboard interfaces:

- **Citizen Activity Feed:** A social-style card timeline where citizens post infrastructure, utility, or hazard issues. Users can comment, discuss, and vote on potential solutions.
- **Admin Command Sidepanel:** A dashboard view for municipal heads to filter incoming posts by priority, inspect credibility, and dispatch tasks to specialized responders.
- **Organization Taskboard:** An operational workspace for registered partner organizations (such as medical teams, electric utilities, and rescue groups) to inspect assigned tasks, write progress updates, and mark dispatches as resolved.

---

## 🧠 Gemini API AI Engine

The prototype demonstrates the integration of the **Gemini API** (`gemini-1.5-flash`) for real-time intelligent analysis:

1. **Semantic Severity Scoring:** Analyzes the title and description of new posts to calculate emergency severity (**Critical**, **High**, **Medium**, **Low**). It detects the gravity of situations (like collapsed structures or gas leaks) contextually rather than matching exact keywords.
2. **Upcoming Crisis Forecasting:** Scans community feeds and environmental data to project upcoming threats, triggering site-wide alert banners for high-risk regions.
3. **Credibility Validation:** Analyzes reports against simulated open data streams and official notices to verify validity and flag potential duplicates.
4. **Actionable Summaries:** Distills multiple community comments into unified solution briefs for dispatcher review.

*Note: When running in local mode, the application uses a client-side semantic heuristic to simulate Gemini's evaluation output.*

---

## 💾 Dual-Sync Storage Engine

To guarantee functionality during emergency outages and remote usage, the prototype features a dual-mode storage engine:
- **Local Mode:** Operates entirely client-side using browser-based local storage cache. Perfect for zero-configuration testing and offline use.
- **Firebase Mode:** Connects to an online cloud database for real-time cross-device updates (allowing a citizen on one device to post and see an admin on another device immediately receive a dispatch notification).

---

## 🚀 How to Run and Test the Demo

### 1. Launch the Application
Open the primary HTML file in any modern web browser.

### 2. Instant Sign-In (Demo Roles)
Use the **Quick Access** panel on the sign-in screen to toggle between profiles instantly:
- **Citizen:** Post issues, upload mock media, and reply to community posts.
- **Supervisor (Admin):** Monitor incoming reports, review priority queues, and issue dispatches.
- **Organization:** Manage dispatches, update resolution status, and complete tasks.

### 3. Verify the AI Classification
1. Sign in as a **Citizen**.
2. Create a new post describing an urgent situation (e.g., `"major water main break flooding the street"` or `"wires sparking near local school"`).
3. The simulated Gemini engine will automatically assign the correct priority rating.
4. Sign in as an **Admin** to see the issue prioritized at the top of the critical queue.
