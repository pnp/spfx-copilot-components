/**
 * The part of the Agent Review corpus component that the Agent Map reads.
 * The Agent Map does not run a review, so it keeps only the skill identity and
 * the redacted SKILL.md text.
 */
export interface SkillReviewCorpusComponent {
  skillComponentId: string;
  skillSchemaName: string;
  skill_markdown: string;
}

/** A standard topic in a review corpus. The Agent Map ignores these components. */
export interface StandardTopicCorpusComponent {
  evaluationType: 'StandardTopic';
}

export type ReviewCorpusComponent = SkillReviewCorpusComponent | StandardTopicCorpusComponent;

export function isStandardTopicComponent(
  component: ReviewCorpusComponent,
): component is StandardTopicCorpusComponent {
  return 'evaluationType' in component && component.evaluationType === 'StandardTopic';
}
