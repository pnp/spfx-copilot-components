# Zava Employee Agent: 10-minute business value demo

## Purpose

Use this version for HR, employee-experience, and Microsoft 365 leaders who need to see more than the concise keynote. It demonstrates dynamic inline UX, safe employee actions, manager decisions, cross-family context, and the value of one employee workspace.

> **Conversation identifies the HR moment. Purpose-built UX makes the answer and action trustworthy.**

## Audience

- HR and employee-experience leaders
- HR service owners and people managers
- Payroll, benefits, learning, and policy stakeholders
- Microsoft 365 and Copilot adoption leaders
- Product owners evaluating agentic UX patterns

## Before presenting

- Deploy `sharepoint/solution/zava-employee-agent.sppkg` to the demo tenant.
- Use the manager-capable Megan persona.
- Open a fresh conversation with Zava Employee Agent.
- Keep [Zava-Employee-Agent-Demo-Prompts.md](Zava-Employee-Agent-Demo-Prompts.md) available.
- Use desktop width for the full-screen workspace.
- Describe all data, calculations, recommendations, and confirmations as deterministic sample behavior.

## Demo arc

```text
Ask -> Understand -> Review -> Explain -> Expand -> Prioritize -> Compare -> Decide
```

## Timed script

### 0:00-0:45 - Set the employee-experience problem

**Say:**

> "Employees do not need another HR chatbot that returns policy paragraphs and links. They need the right balance, form, calculation, evidence, and safe next action at the moment they ask. Zava lets the conversation choose a purpose-built experience without forcing the employee to know which HR system owns the task."

### 0:45-2:05 - Turn a natural request into controlled action

**Paste:**

> **I want to request vacation from 2027-08-04 to 2027-08-12 for a family trip.**

**Expected tool:** `RequestTimeOff`

**Do:**

1. Point to the editable leave type on the first row, the paired Start date and End date pickers
   beneath it, and the reason.
2. Point to seven working days, the August 6 conflict, and healthy coverage.
3. Select **Review request**.
4. Inspect the explicit summary, then select **Submit for approval**.
5. Show mocked request `PTO-2027-0812`.

**Say:**

> "Copilot extracts only what I stated. Deterministic UX calculates known values and exposes every field before the action boundary. The prompt never submits the request. The employee reviews and confirms it. This receipt is local sample state; no HR system is changed."

### 2:05-3:05 - Explain pay visually

**Paste:**

> **Explain why my pay changed in 2026-07 compared with 2026-06, including deductions.**

**Expected tool:** `ExplainPayChange`

**Do:** Point to previous net pay, positive recognition adjustment, withholding change, and current net pay.

**Say:**

> "A different question produces a different UX. Pay movement becomes a driver explanation rather than another paragraph. The employee sees the result and the proof together."

### 3:05-4:05 - Ground a policy answer

**Paste:**

> **What parental leave policy applies to me in Finland on 2026-08-01? Include sources.**

**Expected tool:** `AskPolicy`

**Do:** Point to applicability, confidence, effective date, and source receipts.

**Say:**

> "Policy answers show where the conclusion came from and when the evidence became effective. A production implementation could replace these mock receipts with SharePoint search while preserving the same trust pattern."

### 4:05-5:15 - Expand into the employee workspace

**Do:** Open the full-screen control from the pay or policy component.

**Point out:**

- ten family destinations in one persistent workspace
- personalized hero and current metrics
- five complete internal routes per family
- session settings and explicit offline disclosure

**Say:**

> "Inline stays focused on one intent. Full screen adds context only when the employee asks for it. Twenty independently routed tools share one coherent ten-family workspace rather than twenty unrelated applications."

### 5:15-6:25 - Build the cross-family action plan

**Do:** Select **Home**, then **Build my HR action plan**.

**Point out:**

- local reviewing state and progressive reveal
- ranked urgency across HR families
- reason, timing, family badge, and direct destination
- disclosure that suggestions are generated locally and not saved

**Say:**

> "The action plan brings together leave, learning, benefits, payroll, support, rewards, approvals, and people signals. It explains why each item matters and navigates to the owning experience."

### 6:25-7:20 - Compare benefits around a life event

**Paste:**

> **Compare employee-and-children benefit plans for two dependents. Prioritize a low deductible and dental coverage.**

**Expected tool:** `CompareBenefitPlans`

**Do:** Show the weighted comparison and the dependent-aware cost context.

**Say:**

> "The prompt changes visible comparison criteria. The component remains deterministic and reviewable, while the employee avoids manually translating a life situation into plan filters."

### 7:20-8:15 - Protect a private support path

**Paste:**

> **Open a sensitive payroll HR case. Subject: July deduction question. Details: Please explain the unexpected deduction on my July statement.**

**Expected tool:** `CreateHRCase`

**Do:** Show the private boundary, review step, and mocked case confirmation.

**Say:**

> "Sensitive detail stays inside the case workflow instead of leaking into Home or a general answer. The employee sees exactly what HR would receive before confirming."

### 8:15-9:15 - Show manager decision support

**Paste:**

> **Show my pending leave approvals.**

**Expected tool:** `GetApprovalInbox`

**Do:** Review Lee Gu's request, inspect balance/conflict/coverage, choose a decision, and stop at or complete final confirmation.

**Say:**

> "The prompt opens a queue; it cannot approve anything. The manager reviews the requester, evidence, and impact before choosing and confirming. Non-managers receive an explicit unavailable state rather than private manager data."

### 9:15-10:00 - Close on business value

**Say:**

> "Zava demonstrates a reusable employee-agent pattern: conversation resolves to the right UX, evidence stays visible, sensitive paths remain bounded, and consequential actions require confirmation. Mock services can later be replaced by Microsoft Graph, SharePoint, or HR connectors without redesigning the employee experience."

## Business value summary

- **Less navigation:** employees begin with intent rather than system ownership.
- **Faster completion:** prompt values prefill focused forms and comparisons.
- **Better trust:** calculations, effective dates, evidence, and privacy boundaries remain visible.
- **Safer actions:** review and confirmation are deterministic UX requirements.
- **Manager clarity:** decisions include requester context and operational impact.
- **Demo reliability:** all runtime data and media are bundled and offline.

## Fallback path

If full-screen mode is unavailable, show Request Time Off, Explain Pay Change, and Approval Inbox inline. End on an explicit review/confirmation screen and state that no live system is changed.

## Rehearsal checklist

- [ ] Start a fresh conversation and use the exact prompts.
- [ ] Each prompt selects the expected tool.
- [ ] Time off shows seven working days and one conflict.
- [ ] Pay change shows positive and negative drivers.
- [ ] Policy answer includes effective source receipts.
- [ ] Full screen opens the owning family without losing context.
- [ ] My HR action plan reveals ranked cross-family priorities.
- [ ] Sensitive case details remain inside the private workflow.
- [ ] Manager decision requires explicit confirmation.
- [ ] The story completes in ten minutes.
