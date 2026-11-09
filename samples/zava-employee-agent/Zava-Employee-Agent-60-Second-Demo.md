# Zava Employee Agent: 60-second demo

## Demo goal

Show how a natural-language HR request becomes a purpose-built, reviewable Copilot Component, then expands into a coherent employee workspace. The sample is offline and all confirmations are mocked.

## Before presenting

- Start a fresh Microsoft Copilot conversation with Zava Employee Agent.
- Use the manager-capable Megan persona.
- Keep the browser wide enough to show the full-screen family rail.
- Do not describe the mocked confirmation as a live HR-system transaction.

## Timed script

### 0:00-0:10 - Set the premise

**Say:**

> "Employees do not only need HR answers. They need the right calculation, evidence, and safe next action. Zava lets Copilot select a purpose-built UX for each request."

### 0:10-0:35 - Turn language into controlled action

**Paste:**

> **I want to request vacation from 2027-08-04 to 2027-08-12 for a family trip.**

**Expected tool:** `RequestTimeOff`

**Say:**

> "Copilot extracts the leave type, dates, and reason, but it does not submit anything. The deterministic component calculates seven working days, shows the calendar conflict and team coverage, and keeps every value editable."

**Do:** Select **Review request** and point to the explicit review summary. Do not submit during the 60-second path.

### 0:35-0:52 - Expand without losing context

**Do:** Select the full-screen control.

**Say:**

> "The focused inline task expands into the same ten-family employee workspace without leaving Copilot. Home combines leave, learning, benefits, payroll, support, rewards, manager, and people signals into one explainable action plan."

**Do:** Open **Build my HR action plan** and pause on the progressive reveal.

### 0:52-1:00 - Close on trust

**Say:**

> "AI selects and prefills the experience. Deterministic UX makes it precise. The employee reviews every consequential action. This sample runs on local mock data and changes no live HR system."

## Expected proof points

- `RequestTimeOff` is selected from the natural-language request.
- Leave type appears above side-by-side Start date and End date pickers; dates and reason stay editable.
- Seven working days, one conflict, and healthy coverage are shown.
- Full screen opens the shared HR workspace.
- My HR action plan discloses that recommendations are generated locally and are not saved.

## Recovery

If routing selects another component, start a fresh conversation and paste the prompt exactly. If full-screen mode is unavailable, complete the inline review and close on the explicit human-confirmation boundary.
