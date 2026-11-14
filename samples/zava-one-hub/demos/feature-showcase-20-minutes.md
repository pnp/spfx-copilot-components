# Twenty-minute feature showcase

## Story

Follow Megan Bowen through one workday: catch up on the company, plan personal work, recognize a
colleague, make a manager decision, use employee services, inspect business performance, and discover
the broader Zava One capability set.

## Preflight

- Complete [Demo operations](./demo-operations.md#preflight).
- Reset vacation approvals to 4 pending / 2 processed.
- Open Combined workspace / Company, Copilot, and the local fallback routes.
- Use a real modern SharePoint page only for the optional Top Actions segment.

## 0:00-2:00 — Company front door

Open the Combined workspace on Company.

Say: "This is the shared company context: a pinned update and 17 purpose-built experiences arranged in
three configurable columns."

Scroll deliberately through News, Events, People, Daily Signal, Recognition, Campus Menu, Projects,
Sales, Goals, Stock, Glossary, Security, and Offices. Do not race through every card; establish breadth
and return to focused Copilot answers.

Optional authoring cut on a real SharePoint page:

1. Edit the page.
2. Open Company News **Layout** Top Action.
3. Switch Editorial → Filmstrip → Compact list.
4. Open **Advanced settings** and point to image/source/item controls.

## 2:00-3:30 — News and trusted knowledge

Ask **What's new across Zava this week?**

- Tool: `ShowCompanyNews`
- Route: `company/news`
- Open **One Zava, closer to every customer**.
- Point to named author, publication metadata, image, source label, and SharePoint handoff.

Ask **Find the parental leave policy for Finland.**

- Tool: `FindCompanyKnowledge`
- Route: `company/knowledge`
- Point to verified source/effective-date treatment.
- Contrast with **What does CXR mean at Zava?**, which routes to `FindCompanyTerm` / `company/glossary`.

## 3:30-5:30 — Personal work and planning

Switch to Personal or ask **What should I focus on today?**

- Tool: `ShowMyDay`
- Route: `personal/my-day`
- Open Agenda, Tasks, Important Mail, and Required Learning from their summary tiles.
- Return after each drill-down to prove one compositional experience.

Select **Plan my day**.

- Wait for the 800ms prioritization state.
- Let the three recommendations reveal.
- Read the **Nothing is scheduled automatically** safeguard.

## 5:30-7:00 — Recognition form

Ask **Help me send praise to Johanna for making the accessibility lab welcoming.**

- Tool: `ShowRecognitionAndCommunities`
- Route: `company/praise`

Demonstrate:

1. Recipient is Johanna Lorenz.
2. Message remains editable.
3. Select a Zava value and review the audience.
4. Continue to review, then use **Edit** to prove draft retention.
5. Confirm only if the audience wants the clearly simulated receipt.

Say: "A prompt may prefill a draft, but the person still reviews the recipient, message, value, and
audience."

## 7:00-9:30 — Manager decision and shared state

Ask **Show vacation requests waiting for my decision.**

- Tool: `ReviewVacationRequests`
- Route: `personal/vacation-approvals`

Demonstrate:

1. Baseline: 4 pending / 2 processed.
2. Select the **Johanna Lorenz** request row.
3. Review dates, projected balance, coverage, employee note, and revision.
4. Select **Review decision**.
5. Keep Approve, then select **Approve vacation request**.
6. Read `ZAVA-LEAVE-1043` and **Session-only demo update**.
7. Return to the list: 3 pending / 3 processed.

Optional validation cut: choose a pending request, switch Decision to Decline, and show that a reason is
required. Cancel without changing the fixture.

## 9:30-11:30 — Employee services workflow

Ask **Find a room for four at 14:00.**

- Tool: `FindWorkplaceSpace`
- Canonical route: `personal/workplace-space`

Demonstrate:

1. Helsinki / October 1 / 14:00 / 60 minutes / 4 people.
2. Select **Search available rooms** and allow the loading state to appear.
3. Select **Northern Lights**.
4. Select **Review booking** and inspect office, date/time, duration, and capacity.
5. Confirm only when you want the session-local receipt.

Error cut: return to criteria and request 20 people to show an honest no-match result and recovery path.

## 11:30-12:45 — IT versus security boundary

Ask **My VPN is not working.**

- Tool: `GetITHelp`
- Route: `personal/it-help`
- Show personal issues, known incidents, and the review-before-submit flow.

Then ask **Help me report a suspicious email.**

- Tool: `ReportSecurityConcern`
- Route: `company/report-now`
- Point out confidential intake language, category choice, description, contact preference, review, and
  security-specific receipt.

Say: "IT support and confidential security reporting are deliberately separate tools and workflows."

## 12:45-14:30 — Business performance

Ask **Show EMEA bookings this quarter.**

- Tool: `ShowSalesPerformance`
- Route: `company/sales-performance`
- Change Region EMEA → Americas → APAC.
- Change Period Q1 FY27 → Q4 FY26.
- Point out headline metrics and trend geometry updating together.

Optional exact-table cut: open Equity, select a quarter using keyboard or pointer, and show the exact
quarterly table beneath the D3 bars. Keep the received/estimate distinction visible.

## 14:30-16:00 — Global office map

Ask **Show me Zava offices around the world.**

- Tool: `ShowOfficeDetails`
- Route: `company/offices`

Select Los Angeles, Singapore, and Helsinki using the office buttons. Point out:

- the map and list control the same selected detail;
- local times derive from IANA zones at one deterministic fixture instant;
- address, services, people count, and operating status remain visible without geolocation.

## 16:00-17:30 — Session personalization

Return to Personal workspace.

1. Select **Edit layout**.
2. Move Tasks to another column using its move handle.
3. Hide one nonrequired panel.
4. Select **Done editing**.
5. Open **Personalize**, restore the panel, and dismiss the rail.
6. Refresh to show the arrangement persists within this browser session.

Say: "This is explicitly session-only. It is not cross-device synchronization. Closing the browser
session resets it to the recommended recipe."

## 17:30-18:45 — Capability Explorer

Select **Explore Zava One** or ask **Show me all the company and employee experiences Zava One can help with.**

- Tool: `ExploreAgentCapabilities`
- Search **security**.
- Filter to **Services**, then **Business**.
- Open a result and copy its safe prompt.
- Point out all 35 scenarios are generated from the canonical catalog.

## 18:45-20:00 — Reliability and close

Return to vacation approvals and select **Reset demo data**.

- Verify 4 pending / 2 processed.
- Show the local fallback route table.
- Close with the evidence: 42 tests, 4,080 responsive browser states, 37 plugin functions, 39 engineering screenshots, 15 publication
  captures, 28 bundled media assets, and one validated SPPKG.

Closing line:

"Zava One gives employees one coherent place for company context, personal work, services, and
decisions, while keeping every tool narrow, every action reviewable, and every demo outcome honest."

## Optional feature swaps

| Audience | Replace a segment with | Prompt |
| --- | --- | --- |
| HR / People | Benefits and life events | **What changes after moving country?** |
| Frontline | Shifts and attendance | **When is my next shift?** |
| Finance | Expenses and travel | **Help me finish my Berlin expense claim.** |
| Project leadership | Project health | **Why is Project Aurora at risk?** |
| Executives | Goals and scorecards | **How are our customer experience goals tracking?** |
| Communications | Events and town halls | **When is the next town hall?** |
| Workplace | Campus menu | **What's vegetarian in Redmond today?** |
| New employee | Onboarding | **What do I need to do before my first day?** |