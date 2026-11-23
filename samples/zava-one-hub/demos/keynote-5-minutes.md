# Zava One - five-minute keynote

## One employee experience, wherever the work starts

**Audience:** employee-experience leaders, customers, partners, and keynote audiences.
**Promise:** useful company context, an accountable human decision, and interactive business insight
inside the conversation, with a broader workspace when needed.

The story is **Company -> focused answer -> manager decision -> business insight -> wider context**.
Do not open with a catalog tour or expand every card. The inline experience must already be useful.

## Setup - not spoken on stage

- Complete [demo operations](./demo-operations.md#preflight) and rehearse in the authenticated target
  Copilot tenant. Local rendering does not prove model routing, consent, or host expansion.
- State once: **"The records are fictional; confirmed actions stay in this demo session."**
  Keep source/simulation notes visible where provided.
- Open the combined Company workspace, agent conversation, and
  [ordered screenshot fallback](../assets/publication-screenshots.md) before the clock.
- Reset C35: **4 Awaiting decision / 2 Processed this session**. The second counter includes two
  seeded historical decisions; it does not mean you have already made two decisions today.
- Keep **Johanna Lorenz / vac-1043** throughout the decision story. Dates roll forward at runtime:
  use the displayed dates, **3 workdays**, balance **11 -> 8**, and coverage **attention**.
- The [intent matrix](../docs/intent-component-mapping.md) records exact destinations and limitations.
  Prompts select experiences, but several advertised filters/prefills are not applied by the current UI.

## 0:00-0:30 - Start with the company, not the software catalog

Show the already-open combined workspace on **Company**. Point to the company update, newsroom,
events, and one business signal; do not scroll through all 17 modules.

Say: **"Employees should not have to remember which application owns every question. Start with the
company context, then bring the right experience into the conversation."**

Checkpoint: [Company workspace](../assets/screenshot-company-workspace.png).

## 0:30-1:05 - A focused answer with a human source

In the agent, choose **Catch up on Zava** or submit:

> What's new across Zava this week?

Expected: **ShowCompanyNews**, inline news collection, catalog route **company/news**.
Open **One Zava, closer to every customer**. Show the named author, publication date, and story.

Say: **"This is not a paragraph standing in for an application. I can open the story, inspect its
source, and keep working here."**

Do not click **View news in SharePoint** as proof of integration; that fixture button does not
implement a live source handoff. Save **Ask Copilot about this story** for the longer demo.

Checkpoint: [News](../assets/screenshot-company-news.png).

## 1:05-2:40 - The person owns the decision

Submit:

> Show vacation requests waiting for my decision.

Expected: **ReviewVacationRequests**, inline queue, catalog route **personal/vacation-approvals**.

1. Show **4 Awaiting decision / 2 Processed this session**.
2. Select **Johanna Lorenz**. Show 3 workdays, balance 11 -> 8, and **attention** coverage.
   One design review needs another facilitator; do not describe the request as conflict-free.
3. Say: **"The employee's request and the team's coverage are visible before I decide."**
4. Select **Review decision**. Keep **Approve request** in the Decision selector.
5. Say: **"The prompt opened the work. It did not approve anything."**
6. Select **Approve vacation request** once.
7. Read reference **ZAVA-LEAVE-1043** and **Session-only demo update. No HR submission.**
8. Select **Back to updated list**: pending **4 -> 3**, processed **2 -> 3**.

Stay inline until the receipt and updated queue are shown. Expanding mid-draft mounts a separate
workspace body; exact draft/selection continuity is not implemented.

Checkpoints: [detail](../assets/screenshot-vacation-detail.png),
[review](../assets/screenshot-vacation-decision.png),
[receipt](../assets/screenshot-vacation-receipt.png),
[updated queue](../assets/screenshot-vacation-updated-list.png).

## 2:40-3:20 - Inspect the business, not a static picture

Choose **Review sales performance** or submit:

> Show EMEA bookings this quarter.

Expected: **ShowSalesPerformance**, **company/sales-performance**.
Point to the visible **EMEA / Q1 FY27** fixture scope and **EUR 5.1M** bookings.
Change **Region** to **APAC**: bookings becomes **EUR 3.9M** and the trend redraws.

Say: **"I can change the business scope and inspect the numbers behind the answer."**

Only Region changes this series. Period currently changes its label, not its data; do not demonstrate
it as a historical comparison. Pipeline, win rate, and margin are separate fixed fixture values.

Checkpoint: [Sales](../assets/screenshot-sales-performance.png).

## 3:20-4:05 - Bring the global workplace into the conversation

Choose **Explore global offices** or submit:

> Show me Zava offices around the world.

Expected: **ShowOfficeDetails**, **company/offices**.
Select **Singapore**, then **Helsinki**, using the equivalent office buttons or map markers.
Show the matching detail, address, services, and local-time display.

Say: **"A global workforce needs a usable view of its workplace, not another list of links."**

The clock uses IANA time zones at a fixed fixture instant; it is not the current wall clock.

Checkpoint: [Offices](../assets/screenshot-office-map.png).

## 4:05-4:40 - More context when needed

Use the office component's **Expand** action. If the host accepts, show the composed **Company**
workspace. The owning tab is selected, not an exact office-detail deep link.

Switch to **Personal** and open **Plan my day**. Let the planning sequence finish.

Say: **"Focused work lives in the conversation. When I need the wider picture, the same capability
code is composed into a Company or Personal workspace."**

If expansion is denied or slow, use the pre-opened combined workspace and name that switch honestly.
Do not imply that changing tabs synchronizes drafts between Copilot, SharePoint, and Teams.

Checkpoint: [Personal](../assets/screenshot-personal.png).

## 4:40-5:00 - Close on the employee outcome

Say: **"Company context, personal work, and accountable decisions, wherever the work starts.
One experience model, focused answers, and a person in control."**

Finish on the Personal workspace. If ahead of time, return to chat and use **Explore Zava One** to
show searchable breadth: 35 business scenarios. Explorer is the optional closing beat, not the opener.

## Timing cuts and recovery

- **Model latency:** pre-open the exact cards during rehearsal; name them as prepared views.
  Never narrate a missing response as successful routing.
- **Four-minute cut:** omit Sales and the optional Explorer, not review/confirmation.
- **Ninety-second cut:** use the [short script](./keynote-90-seconds.md).
- **Tenant failure:** switch to [local routes or screenshots](./demo-operations.md#offline-fallback),
  state that these show shared UI rather than actual Copilot routing.
- **Unexpected queue:** reset and verify 4/2. Never substitute another employee or invent a receipt.

## Acceptance before keynote sign-off

Record actual tool selection, C35 counts/reference, Region redraw, keyboard office selection,
host-approved expansion, timing including model latency, and fallback readiness.
The [release checklist](../todo.md#remaining-release-gates) remains open until those checks are run.
This script is not a claim of production readiness or fresh GA tenant certification.
