import { reviewAnswerSchema } from '../answerSchema';

it('accepts exactly the four bounded fields of an answer', () => {
  const valid = { requestId: '86514632-3557-4784-9fc8-d9172d944dc4', review: 's1:r:-', note1: '', note2: '' };
  expect(reviewAnswerSchema.safeParse(valid).success).toBe(true);
  expect(reviewAnswerSchema.safeParse({ ...valid, review: '?'.repeat(176), note1: '￿'.repeat(48), note2: '￿'.repeat(48) }).success).toBe(true);
  for (const value of [
    { ...valid, extra: true }, { ...valid, requestId: 'not-an-id' }, { requestId: valid.requestId, resultJson: '{}' },
    { ...valid, review: 'a'.repeat(177) }, { ...valid, review: 's1:r:i@1 ' }, { ...valid, review: '界' },
    { ...valid, note1: 'a'.repeat(49) }, { ...valid, note2: 'a'.repeat(49) }
  ]) expect(reviewAnswerSchema.safeParse(value).success).toBe(false);
});
