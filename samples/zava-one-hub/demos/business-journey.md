# Business journey walkthrough

Target duration: 8-12 minutes. The journey follows Megan Bowen from company context to personal work,
a safe manager decision, and an explainable business visualization.

## 1. Company front door

Open the Combined workspace on the Company tab.

- Point out the company-wide update, newsroom, events, people, daily signal, projects, sales, goals,
  stock, and offices.
- Explain that Company and Personal layouts have independent session-only order and visibility.
- Use **Edit layout** or **Personalize** only if there is time; do not imply cross-device persistence.

Checkpoint: [Company workspace](../assets/screenshot-company-workspace.png).

## 2. Focused company answer

Ask **What's new across Zava this week?**

- Expected tool: `ShowCompanyNews`
- Expected route: `company/news`
- Show the source, publication date, named author, and detail transition.
- Explain that SharePoint authors select the six layouts through Top Actions or the property pane.

Then ask **Find the parental leave policy for Finland.**

- Expected tool: `FindCompanyKnowledge`
- Expected route: `company/knowledge`
- Point out the verified source and effective-date treatment.

## 3. Personal work

Switch to the Personal tab, or ask **What should I focus on today?**

- Expected tool: `ShowMyDay`
- Expected route: `personal/my-day`
- Show agenda, tasks, important mail, required learning, and company highlights.
- Open **Plan my day** to demonstrate the deterministic planning sequence.
- State that personalization is stored only for the current browser session.

Checkpoint: [Personal workspace](../assets/screenshot-personal.png).

## 4. Review before action

Ask **Help me send praise to Johanna for making the accessibility lab welcoming.**

- Expected tool: `ShowRecognitionAndCommunities`
- Expected route: `company/praise`
- Show the recipient, message, value, and audience before confirmation.
- Do not confirm unless the audience wants to see the simulated receipt.

Checkpoint: [Praise composer](../assets/screenshot-recognition-compose.png).

## 5. Manager decision and canonical state

Ask **Show vacation requests waiting for my decision.**

- Expected tool: `ReviewVacationRequests`
- Expected route: `personal/vacation-approvals`
- Open Johanna Lorenz and review dates, balance impact, coverage, and employee note.
- Select **Review decision**, then **Approve vacation request**.
- Point out the session-only simulated receipt and reference.
- Return to the updated queue and verify the pending count changed from four to three.

Checkpoints: [list](../assets/screenshot-vacation-approvals.png),
[detail](../assets/screenshot-vacation-detail.png),
[decision](../assets/screenshot-vacation-decision.png),
[receipt](../assets/screenshot-vacation-receipt.png), and
[updated list](../assets/screenshot-vacation-updated-list.png).

## 6. Business information and visualization

Ask **Show EMEA bookings this quarter.**

- Expected tool: `ShowSalesPerformance`
- Expected route: `company/sales-performance`
- Compare actual, target, variance, chart geometry, and the exact-value table.

Ask **Show me Zava offices around the world.**

- Expected tool: `ShowOfficeDetails`
- Expected route: `company/offices`
- Select Helsinki on the map and show the equivalent list, local time, and services.

Checkpoints: [sales](../assets/screenshot-sales-performance.png) and
[offices](../assets/screenshot-office-map.png).

## 7. Close with breadth

Select **Explore Zava One**.

- Expected tool: `ExploreAgentCapabilities`
- Search, filter, and copy a prompt without mutating business state.
- Close on 35 paired capabilities, three composed workspaces, and one shared implementation model.

Checkpoint: [Capability explorer](../assets/preview.png).

Use [Demo operations](./demo-operations.md) to reset before the next run.