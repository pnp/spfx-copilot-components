# Zava Employee Agent: 3-minute demo story

## The story

**Wouldn't it be great if an agent could show the exact UX needed for each HR moment, instead of answering every request with more text? Guess what: it can.**

Zava Employee Agent combines two models:

1. **Probabilistic conversational understanding** interprets the employee's intent and extracts stated details from natural language.
2. **Deterministic Copilot Components** render the appropriate trusted UX, calculate known values, expose exactly what was understood, and require explicit review before an action.

The core message is:

> **AI understands the request. The UX component makes it precise. The user remains in control.**

A user can speak naturally, but the experience becomes specific before anything consequential happens. Dates become date fields. Pay changes become a waterfall. Cross-family priorities become a structured action plan. Requests are never submitted, cases are never opened, and approvals are never decided directly from prompt text.

## Primary demo arc

The primary three-minute story uses two inline components before expanding into the shared full-screen HR workspace:

1. **Request time off:** natural language becomes an editable, conflict-aware workflow with review and confirmation.
2. **Explain pay change:** a question becomes a visual driver analysis rather than prose.
3. **Expand to Money:** the compact answer opens into a complete payroll workspace with five internal views and a streamed explanation panel.
4. **Move to Home:** the signature My HR action plan turns coherent signals across HR into a prioritized, explainable plan.

## Before presenting

- Use the manager-capable Megan persona so both employee and manager experiences are available.
- Start a fresh Copilot conversation.
- Ensure the agent is installed and the inline component advertises full-screen mode.
- Keep the browser wide enough to show the left family rail and right explanation panel.
- Do not describe any mocked confirmation as a real system transaction.
- Pause after each prompt so the audience sees Copilot select the component and render the UX.

## Timed presenter script

### 0:00-0:20 — Open with the problem

**Say:**

> “Most HR agents can answer a question. But employees don't just need answers. They need the right form, the right calculation, the evidence, and a safe next action. Wouldn't it be great if the agent could dynamically render exactly the UX needed for each HR case? Guess what: it can.”
>
> “The conversational model can interpret what I mean. The Copilot Component then turns that non-deterministic understanding into a deterministic, reviewable experience.”

**On screen:** Open Zava Employee Agent in Microsoft Copilot with an empty conversation.

### 0:20-1:05 — Inline guided action: request time off

**Paste this prompt:**

> **I want to request vacation from 2027-08-04 to 2027-08-12 for a family trip.**

**Expected tool:** `RequestTimeOff`

**Expected extracted properties:**

```text
leaveType: vacation
startDate: 2027-08-04
endDate: 2027-08-12
reason: Family trip
```

**As the inline component appears, say:**

> “Copilot understood the intent and extracted only the details I stated. But notice what happens next: it doesn't claim the request is complete, and it doesn't submit anything.”
>
> “The component gives me editable dates, calculates seven working days, checks a mocked calendar conflict, and explains team coverage. This is the deterministic part of the experience.”

**Do:**

- Point to the prefilled leave type on the first row, the paired Start date and End date pickers
  beneath it, and the reason.
- Point to **7 working days**, the August 6 conflict, and healthy coverage.
- Click **Review request**.

**Say:**

> “Before crossing the action boundary, I see exactly what will happen. The summary is explicit: leave type, dates, working days, reason, and the known conflict.”

- Click **Submit for approval**.
- Pause on **Time-off request sent for approval** and request `PTO-2027-0812`.

**Say:**

> “The important distinction is: the AI did not submit the request. I reviewed it, and I confirmed it. In this sample the confirmation is local and mocked, but the interaction contract is the same one a production connector would use.”

### 1:05-1:35 — Inline visual explanation: pay change

**Paste this prompt:**

> **Explain why my pay changed in 2026-07 compared with 2026-06, including deductions.**

**Expected tool:** `ExplainPayChange`

**Expected extracted properties:**

```text
period: 2026-07
compareTo: 2026-06
includeDeductions: true
```

**Say:**

> “A different request gets a different UX. I didn't ask for a form; I asked for an explanation. So instead of another paragraph, Copilot renders a pay-change waterfall.”
>
> “I can see the previous net pay, the recognition increase, the withholding change, and the current net pay. The answer, the action, and the proof are in the canvas.”

**Do:** Point to the positive and negative drivers and the one-time adjustment disclosure.

### 1:35-2:15 — Expand for the full-screen wow effect

**Do:** Click the full-screen icon in the **Why your pay changed** inline header. Its tooltip is **Open full HR dashboard**.

**As the full-screen Money tab opens, say:**

> “The inline component is focused on one intent. But when I need context, the same component expands into the full employee workspace, already focused on Money.”

**Point out:**

- Personalized Money hero and four payroll metrics.
- Five complete internal views: latest pay, change explanation, deductions, history, and documents.
- Shared family navigation without leaving the Copilot canvas.

**Do:** Click **Explain my latest pay**.

**As the right panel animates, say:**

> “The panel reviews the available pay details and reveals them progressively. This motion helps the user follow the explanation, but the underlying values and order are deterministic sample data. The disclosure makes that clear.”
>
> “This is a key design pattern: AI-style presentation, deterministic operations, and an honest boundary between the two.”

### 2:15-2:50 — Cross-family intelligence: My HR action plan

**Do:** Close the pay panel, select **Home**, then click **Build my HR action plan**.

**As the plan streams, say:**

> “Now we move from one HR task to the bigger employee picture. Home brings together learning, leave, benefits, payroll, support, rewards, approvals, and people signals.”
>
> “The action plan doesn't just list alerts. It ranks them, explains why each matters, and provides a direct destination into the owning HR experience.”

**Point out:**

- The short “Reviewing your HR signals...” state.
- Progressive recommendation reveal.
- Family badge, reason, timing, and direct action on each item.
- The disclosure that suggestions are generated locally and not saved.

### 2:50-3:00 — Close on trust and control

**Say:**

> “This is the Zava Employee Agent model: speak naturally, get purpose-built UX, inspect the exact values, and confirm every consequential action.”
>
> “The AI helps decide what experience is needed. The Copilot Component makes the outcome precise, deterministic, and safe.”

## What the audience should remember

- **Dynamic UX:** Each intent selects a distinct inline component, not a generic chat response.
- **Precision before action:** Extracted prompt values become visible and editable.
- **Deterministic operations:** Calculations, validations, routes, and confirmation steps follow explicit code paths.
- **Human confirmation:** Prompt text never submits, opens, approves, or declines automatically.
- **Inline to immersive:** A compact task expands into one coherent ten-family HR workspace.
- **Honest AI:** Simulated thinking and streaming are disclosed as local sample behavior.

## Presenter safety language

Use these phrases consistently:

- “Copilot interpreted the intent and extracted the details I stated.”
- “The component shows exactly what it understood.”
- “Nothing is submitted until I review and confirm.”
- “This confirmation is mocked; no live HR system is changed.”
- “The animation is AI-style presentation over deterministic sample data.”

Avoid these claims:

- “AI approved the request.”
- “Copilot changed the HR system.”
- “The agent calculated this probabilistically.”
- “The streamed plan came from a live AI service.”

## Optional 30-second replacements

Use one of these when the audience cares more about privacy or manager workflows than payroll.

### Privacy replacement: private HR case

Replace the pay-change segment with:

> **Open a sensitive payroll HR case. Subject: July deduction question. Details: Please explain the unexpected deduction on my July statement.**

**Show:** private intake → **Review private case** → explicit privacy boundary → **Open case with HR** → mocked case `HR-2049`.

**Say:**

> “Sensitive details remain inside the private case UX. They are not echoed into Home or a shared answer. Again, the prompt prefills; the user reviews and opens the case.”

### Manager replacement: approval decision

Use:

> **Show my pending leave approvals.**

**Show:** approval queue → **Review** Lee Gu's request → coverage evidence → **Approve** or **Decline** → final confirmation → mocked outcome.

**Say:**

> “The initial prompt only opens the decision queue. It cannot approve anything. The manager reviews the person, dates, balance, conflict, and coverage before choosing and confirming a decision.”

## Recovery plan

If tool routing selects the wrong component:

1. Start a fresh conversation.
2. Use the exact prompt above without extra commentary.
3. Confirm the expected tool in diagnostics.
4. Continue from the rendered component; do not narrate a failed route as expected behavior.

If full-screen mode is unavailable, complete the inline time-off workflow and use the pre-opened full-screen Home dashboard as the backup wow moment.

## Post-demo proof points

After the live story, use [Zava-Employee-Agent-Demo-Prompts.md](Zava-Employee-Agent-Demo-Prompts.md) to test all 20 prompt-addressable tools and their expected properties. The full-screen shell additionally contains all 50 originally planned internal HR views.

To extend this story into a global business campaign about modernizing work in Copilot, use
[When Copilot Becomes the Experience](Copilot-Apps-Social-Campaign.md).
