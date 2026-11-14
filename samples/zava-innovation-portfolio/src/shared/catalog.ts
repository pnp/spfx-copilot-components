export type InnovationLens = 'my-innovation' | 'programs-pilots' | 'reviews-gates' | 'investment' | 'enterprise-insights' | 'education';
export type InnovationOperation = 'information' | 'review' | 'submit' | 'education';
export type InnovationIntentKey =
  | 'SubmitInnovationIdea' | 'GetMyInnovation' | 'BuildIdeaBusinessCase' | 'CelebrateInnovationImpact'
  | 'GetInnovationReviewQueue' | 'ReviewIdeaGate' | 'ReviewInnovationFunding'
  | 'ExploreInnovationPortfolio' | 'TrackInnovationValue' | 'GenerateInnovationBrief'
  | 'GetInnovationGrowth' | 'ExploreGlobalInnovation' | 'TrackInnovationBudget'
  | 'GetInnovationPortfolioHealth' | 'LaunchInnovationChallenge' | 'ManageInnovationExperiment'
  | 'ExploreAgentCapabilities';

export interface IInnovationProperties { readonly message?: string; readonly ideaId?: string; readonly region?: string; readonly theme?: string; readonly amount?: number; readonly query?: string; }
export interface IIntentDefinition {
  readonly key: InnovationIntentKey; readonly title: string; readonly lens: InnovationLens; readonly route: string;
  readonly operation: InnovationOperation; readonly role: string; readonly trigger: string; readonly decisionQuestion: string;
  readonly outcome: string; readonly summary: string; readonly positivePrompts: readonly string[]; readonly excludes: string;
}

const intent = (key: InnovationIntentKey, title: string, lens: InnovationLens, route: string, operation: InnovationOperation, role: string, trigger: string, decisionQuestion: string, outcome: string, excludes: string): IIntentDefinition => ({
  key, title, lens, route, operation, role, trigger, decisionQuestion, outcome,
  summary: `${decisionQuestion} ${outcome}`,
  positivePrompts: [`Show me ${title.toLowerCase()}.`, `Help me with ${title.toLowerCase()}.`], excludes
});

export const INTENTS: readonly IIntentDefinition[] = [
  intent('SubmitInnovationIdea','Submit an idea','my-innovation','my-innovation/new-idea','submit','Megan Bowen','A person identifies an opportunity.','How can I turn this problem into a review-ready idea?','Creates a complete idea draft with evidence and explicit confirmation.','Do not use for existing ideas or business cases.'),
  intent('GetMyInnovation','My innovation','my-innovation','my-innovation/overview','information','Megan Bowen','An innovator needs status or a next action.','Which of my ideas needs attention now?','Makes personal progress, feedback, and recognition actionable.','Do not use for enterprise portfolio analysis.'),
  intent('BuildIdeaBusinessCase','Build business case','my-innovation','my-innovation/business-case','submit','Megan Bowen','An idea has passed screening.','Does this idea have a credible financial case?','Models investment, payback, value, and confidence before review.','Do not use for funding approval.'),
  intent('CelebrateInnovationImpact','Celebrate impact','my-innovation','my-innovation/recognition','submit','Megan Bowen','Measured value is available.','Who contributed to this outcome and how should we recognize them?','Creates evidence-grounded praise for a real outcome.','Do not use for general announcements.'),
  intent('GetInnovationReviewQueue','Review queue','reviews-gates','reviews-gates/review-queue','information','Diego Siciliani','Gate decisions are waiting.','Which reviews need my attention first?','Prioritizes review work by age, evidence, and consequence.','Do not use to make a decision.'),
  intent('ReviewIdeaGate','Gate review','reviews-gates','reviews-gates/gate-review','review','Diego Siciliani','A selected idea reaches a gate.','Should this idea advance, change, park, or stop?','Makes the human gate decision transparent and evidence-based.','Do not use for funding decisions.'),
  intent('ReviewInnovationFunding','Funding committee','investment','investment/funding-committee','review','Miriam Graham','A gate-approved idea requests capital.','How should we fund this idea within portfolio constraints?','Shows financial consequences before explicit confirmation.','Do not use for gate review or budget overview.'),
  intent('ExploreInnovationPortfolio','Portfolio command center','enterprise-insights','enterprise-insights/command-center','information','Joni Sherman','Leadership needs the complete operating picture.','Is our portfolio balanced and moving through the funnel?','Coordinates funnel, impact, themes, and selected evidence.','Do not use for personal idea status.'),
  intent('TrackInnovationValue','Value realization','enterprise-insights','enterprise-insights/value-realization','information','Joni Sherman','Funded ideas are producing outcomes.','Are realized benefits matching the original case?','Exposes variance, confidence, milestones, and owners.','Do not use to model future business cases.'),
  intent('GenerateInnovationBrief','Executive brief','enterprise-insights','enterprise-insights/executive-brief','submit','Joni Sherman','Leadership communication is due.','What should leaders know and decide now?','Creates an editable evidence-grounded brief with review.','Do not use for raw portfolio exploration.'),
  intent('GetInnovationGrowth','Program growth','programs-pilots','programs-pilots/growth','information','Johanna Lorenz','Program owners assess momentum.','Is participation turning into quality throughput?','Separates sustainable conversion from submission volume.','Do not use for budget or overall health.'),
  intent('ExploreGlobalInnovation','Global participation','programs-pilots','programs-pilots/geography','information','Johanna Lorenz','Program reach is uneven.','Where are participation and conversion gaps?','Makes regional inclusion and quality gaps actionable.','Do not use for individual submissions.'),
  intent('TrackInnovationBudget','Budget stewardship','investment','investment/budget','information','Miriam Graham','Finance reviews allocation and forecast.','What funding is committed, spent, forecast, and available?','Reconciles the innovation budget and highlights variance.','Do not use to decide one funding request.'),
  intent('GetInnovationPortfolioHealth','Leadership health','enterprise-insights','enterprise-insights/leadership-health','information','Joni Sherman','Leadership needs a concise health assessment.','Where is portfolio health outside target?','Connects health dimensions to accountable exceptions.','Do not use for one metric only.'),
  intent('LaunchInnovationChallenge','Launch a challenge','programs-pilots','programs-pilots/challenge-studio','submit','Johanna Lorenz','Strategy needs focused participation.','How should we frame a measurable innovation challenge?','Connects strategy, audience, criteria, and expected outcomes.','Do not use to submit an idea.'),
  intent('ManageInnovationExperiment','Manage experiment','programs-pilots','programs-pilots/experiment-studio','submit','Johanna Lorenz','A funded pilot must test assumptions.','What did the experiment prove and should we go, pivot, or stop?','Turns observations into a guarded learning recommendation.','Do not use to approve funding or scaling.'),
  intent('ExploreAgentCapabilities','Explore capabilities','education','education/capabilities','education','All roles','A user asks what the agent can do.','Which innovation scenario should I start?','Makes every business capability discoverable with safe previews.','Do not use for a specific operational request.')
];

export const getIntent = (key: InnovationIntentKey): IIntentDefinition => {
  const found = INTENTS.find((item) => item.key === key);
  if (!found) { throw new Error(`Unknown innovation intent: ${key}`); }
  return found;
};

export const LENS_LABELS: Readonly<Record<InnovationLens, string>> = {
  'my-innovation':'My Innovation', 'programs-pilots':'Programs & Pilots', 'reviews-gates':'Reviews & Gates',
  investment:'Investment', 'enterprise-insights':'Enterprise Insights', education:'Capabilities'
};