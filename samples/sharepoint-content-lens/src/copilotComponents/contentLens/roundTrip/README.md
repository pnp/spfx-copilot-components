# The exchange with Copilot

This folder is the part of Content Lens to copy for another component. It packs source text into one bounded request, hands the request to a transport, and checks the answer against the saved text. It imports nothing from SharePoint, the Chat API or the screens. `__tests__/boundary.test.ts` fails if a file imports from outside the folder, apart from Zod, React DOM and the compiler's helper library.

Content Lens supplies the transport in `services/copilotReview.ts`: one new Microsoft 365 Copilot Chat API conversation per request.

## What happens, in order

1. **Pack.** `ReviewClient.analyze(sources, checks, rules)` cuts each source at sentence ends into numbered passages of about 160 characters and sizes the request so that its worst-case answer still fits.
2. **Send.** The client builds the request (`IReviewRequest`, at most 10,000 UTF-8 bytes) and calls your `send(request, signal)`. The signal aborts on cancellation and at the deadline, two minutes by default.
3. **Receive.** `send` returns the answer: `requestId`, `review` of at most 176 characters, `note1` and `note2` of at most 48. An answer with another request ID, an unknown field or an oversized field is refused. So is an answer after the deadline.
4. **Decode and check.** `review` is a compact code, for example `s1:r:i@1,a?@1;s2:r:-`: one row per segment (a long source is cut into several segments), then one letter per flagged check with passage numbers. The numbers are turned back into excerpts of the saved text, and a finding is accepted only when its excerpt is really that slice of its source. An answer that fails any check leaves the whole request not reviewed.
5. **Merge.** `mergeReviewResults` adds the answer of a further request to a review.

## Files

| File | What it holds |
| --- | --- |
| `checks.ts` | The check ids, the rule ids and their limits, the one-letter codes and the pattern of a flag |
| `contracts.ts` | `AnalysisSource`, findings, decisions, results, `IAnalysisClient` |
| `answerSchema.ts` | The four fields of an answer, as Zod |
| `passages.ts` | Cutting text into numbered passages |
| `packing.ts` | Sizing requests: segments, batches, the review-length arithmetic |
| `compactReview.ts` | Decoding the compact review |
| `evidence.ts` | `isFindingValid`, `completeDecisions`, byte counting |
| `reviewClient.ts` | `ReviewClient`: one request, its deadline, the validated answer |
| `mergeResults.ts` | Merging the answer of a further request into a review |
| `componentSurface.ts` | One React root per DOM node; the host can mount a component twice on the same node |

## To reuse it

- Give `ReviewClient` a `send` function and an `ISourceBinding`: a strict Zod schema for one source and, if needed, `sourcesValid` for invariants across sources.
- Your source type extends `AnalysisSource`. The exchange reads only `id`, `chunkId`, `text` and `contextText`.
- Change the checks in `checks.ts` together with the instructions that your transport sends. The ids, the codes, the flag pattern and the review-length arithmetic all encode the same checks.
- Your transport tells the model how to answer. The request carries only data, plus `reviewRuleInstructions` when rules are selected.
- In your component class, call `claimComponentSurface` in `render`, and the client's `dispose` and `releaseComponentSurface` in `onTeardown` and `onDispose`.
