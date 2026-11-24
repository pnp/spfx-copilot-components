import { categoryCodes, flagPattern, isRuleId, type CategoryId } from './checks';
import type { AnalysisSource, ReviewFinding } from './contracts';
import { completeDecisions } from './evidence';
import { maxSegmentsPerRequest, type BatchResult } from './packing';
import { evidencePassages } from './passages';
import type { ReviewAnswer } from './answerSchema';

/** The note for segment s1 or s2; an answer carries no note for later segments. */
function segmentNote(answer: ReviewAnswer, index: number): string {
  if (index === 0) return answer.note1;
  if (index === 1) return answer.note2;
  return '';
}

/**
 * Decodes the compact review of one answer. Its source IDs and passages are resolved only against the sources of its
 * own request. One malformed row, flag or citation makes the whole answer invalid.
 */
export function decodeCompactAnalysis(answer: ReviewAnswer, sources: AnalysisSource[], categories: CategoryId[]): BatchResult {
  const invalid = (): BatchResult => ({ findings: [], decisions: completeDecisions(sources, []), invalid: true });
  const rows = answer.review.split(';');
  if (sources.length < 1 || sources.length > maxSegmentsPerRequest || rows.length !== sources.length) return invalid();
  const findings: ReviewFinding[] = [];
  const decisions: BatchResult['decisions'] = [];
  for (let index = 0; index < sources.length; index++) {
    const row = /^s([1-9]):([rn]):(.+)$/.exec(rows[index]);
    if (!row || Number(row[1]) !== index + 1) return invalid();
    const source = sources[index];
    // A note explains the wording checks of its segment. A rule finding shows its saved rule text in the UI instead,
    // and the app explains findings of later segments by category.
    const explanation = segmentNote(answer, index).trim();
    const reviewed = row[2] === 'r';
    const flagList = row[3];
    // A note on a segment without flags is ignored, so it leaves the other reviews of the request valid.
    if (flagList !== '-') {
      if (!reviewed) return invalid();
      const passages = evidencePassages(source.text);
      // Passages are contiguous slices of the text, so each one's offset is the length of those before it.
      const offsets: number[] = [];
      let offset = 0;
      for (const passage of passages) {
        offsets.push(offset);
        offset += passage.text.length;
      }
      const seen = new Set<CategoryId>();
      for (const flag of flagList.split(',')) {
        const match = flagPattern.exec(flag);
        if (!match) return invalid();
        const category = categories.find(id => categoryCodes[id] === match[1]);
        const start = Number(match[3]);
        const end = Number(match[4] || match[3]);
        const laterPlaces = match[5] ? match[5].slice(1).split('.').map(Number) : [];
        if (!category || seen.has(category) || end < start || !passages[start - 1] || !passages[end - 1]) return invalid();
        // Only a rule cites more than one place. Each later place is an existing passage after the place before it.
        const misplaced = (place: number, placeIndex: number): boolean => {
          const previous = placeIndex ? laterPlaces[placeIndex - 1] : end;
          return place <= previous || !passages[place - 1];
        };
        if (laterPlaces.length && (!isRuleId(category) || laterPlaces.some(misplaced))) return invalid();
        seen.add(category);
        const places: Array<[number, number]> = [[start, end], ...laterPlaces.map(place => [place, place] as [number, number])];
        for (const [from, to] of places) {
          const excerpt = passages.slice(from - 1, to).map(passage => passage.text).join('');
          const excerptStart = offsets[from - 1];
          if (!excerpt.trim() || source.text.slice(excerptStart, excerptStart + excerpt.length) !== excerpt) return invalid();
          findings.push({
            id: `analysis:${findings.length}`,
            sourceId: source.id,
            chunkId: source.chunkId,
            categoryId: category,
            excerpt,
            explanation: isRuleId(category) ? '' : explanation,
            needsContext: !!match[2],
            offset: excerptStart
          });
        }
      }
    }
    decisions.push({ sourceId: source.id, chunkId: source.chunkId, status: reviewed ? 'reviewed' : 'notReviewed' });
  }
  return { findings, decisions, invalid: false };
}
