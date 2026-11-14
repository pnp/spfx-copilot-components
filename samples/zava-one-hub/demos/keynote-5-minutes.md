# Five-minute keynote

## Message

Zava One turns an employee question into a focused Copilot experience, then uses the same React
capability in SharePoint and Teams workspaces. Information stays explainable, and every action pauses
for review before a clearly labeled fixture-only update.

## Preflight

1. Complete [Demo operations](./demo-operations.md#preflight).
2. Reset C35 and verify **4 Awaiting decision / 2 Processed this session**.
3. Open the Combined workspace on Company and the Zava One agent in separate tabs.
4. Keep the local fallback URL table open.

## Presenter script

| Time | Screen and exact action | Speaker cue | Expected proof |
| --- | --- | --- | --- |
| 0:00-0:25 | Show the Combined workspace, Company tab. | "Zava One starts with a composed company front door, not a catalog of disconnected apps." | Company update, news, events, people, signals, projects, sales, goals, stock, and offices share one visual system. |
| 0:25-0:55 | In Copilot ask **What's new across Zava this week?** | "The agent chooses the narrowest company-news tool." | `ShowCompanyNews` opens `company/news`; point to author, publication date, source, and **Demo data**. |
| 0:55-1:20 | Ask **Find the parental leave policy for Finland.** | "A policy question routes to verified knowledge, not glossary or employee services." | `FindCompanyKnowledge` opens `company/knowledge` with source and effective-date context. |
| 1:20-1:40 | Ask **Show vacation requests waiting for my decision.** | "Now we move from information to a safeguarded manager action." | `ReviewVacationRequests` opens `personal/vacation-approvals`; confirm four pending requests. |
| 1:40-2:10 | Select the **Johanna Lorenz** request row. | "The decision starts with evidence: dates, balance impact, team coverage, and the employee note." | Detail remains read-only until **Review decision**. |
| 2:10-2:40 | Select **Review decision**, keep **Approve request**, then select **Approve vacation request**. | "Nothing happens from the prompt alone. The user reviews and explicitly confirms." | Receipt says **Session-only demo update** and shows `ZAVA-LEAVE-1043`. |
| 2:40-3:00 | Select **Back to updated list**. | "One canonical session store updates the queue immediately." | Pending changes 4→3; processed changes 2→3. |
| 3:00-3:30 | Ask **Show EMEA bookings this quarter.** Change Region from **EMEA** to **APAC**, then back. | "Business information is scoped and interactive, with visible metrics rather than an unexplained image." | `ShowSalesPerformance` opens `company/sales-performance`; headline metrics and trend geometry change with Region. |
| 3:30-4:05 | Ask **Show me Zava offices around the world.** Select **Singapore**, then **Helsinki** using the office buttons. | "The map has equivalent keyboard controls and deterministic IANA local times." | `ShowOfficeDetails` opens `company/offices`; map selection, list selection, detail, services, and local time stay aligned. |
| 4:05-4:35 | Select the Personal workspace tab and open **Plan my day**. | "The same product shifts from company context to private work without changing the shell." | Agenda, tasks, mail, learning, company highlights, and the deterministic focus sequence are visible. |
| 4:35-5:00 | Select **Explore Zava One**. | "This is the breadth behind the story: 35 paired capabilities, three composed workspaces, and one shared implementation model." | `ExploreAgentCapabilities` shows searchable scenarios and safe prompts. |

## Closing line

"Zava One brings company context, personal work, services, and decisions together, while keeping every
answer focused and every action reviewable."

## Presenter guardrails

- Say **fixture-only** once; keep **Demo data / No business submission** visible.
- Do not call the receipt a source-system confirmation.
- Do not claim durable cross-device personalization.
- Do not claim authenticated Teams, modern SharePoint Top Actions, or production accessibility until
  the external validation gate is complete.

## Recovery cuts

- Behind schedule: skip the policy question and Personal tab; keep News → C35 → Offices → Explorer.
- Copilot unavailable: use the matching local URLs in [Demo operations](./demo-operations.md#offline-fallback).
- C35 state unexpected: select **Reset demo data** and verify 4 pending / 2 processed before continuing.