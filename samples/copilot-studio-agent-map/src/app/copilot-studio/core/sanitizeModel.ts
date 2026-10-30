/**
 * Persistence-safe copy of the parsed agent model. The code is the same as in
 * the Agent Review app. The Agent Map sends only this copy to the view.
 */
import type { AgentsExperienceModel } from './contracts/AgentsExperienceModel.js';
import type { StandardDocument, StandardJsonValue } from './contracts/StandardReview.js';
import { redactSecrets } from './services/skill/resourceScanners.js';

/**
 * Redact an optional free-text field. Preserves `undefined` for fields that
 * were never populated, but still redacts (and preserves) empty strings.
 */
const redactOptional = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : redactSecrets(value);

function redactStandardValue(value: StandardJsonValue): StandardJsonValue {
  if (typeof value === 'string') return redactSecrets(value);
  if (Array.isArray(value)) return value.map(redactStandardValue);
  if (value && typeof value === 'object') return redactStandardDocument(value);
  return value;
}

function redactStandardDocument(document: StandardDocument): StandardDocument {
  return Object.fromEntries(Object.entries(document).map(([key, value]) => [key, redactStandardValue(value)]));
}

function redactStandardSource(source: string): string {
  // Decode quoted JSON/YAML strings so escaped secret assignments receive the
  // same redaction as the parsed document. Keep unaffected source bytes intact.
  const quotedStrings = /"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/g;
  return redactSecrets(source.replace(quotedStrings, (token: string, offset: number) => {
    if (source.slice(offset + token.length).trimStart().startsWith(':')) return token;
    const value: string = JSON.parse(token);
    const redacted = redactSecrets(value);
    return redacted === value ? token : JSON.stringify(redacted);
  }));
}

/**
 * Project the complete GitHub Copilot harness {@link AgentsExperienceModel} into a
 * persistence-safe copy: redacts secrets/SAS URLs from every free-text
 * surface and discards `agentSettings.raw` (unbounded, unvetted maker JSON)
 * entirely. Does not mutate `model`. Structural identifiers
 * (`name`/`schemaname`/`kind`/`componentId`, and `AeGrader.labels[].name`)
 * are left untouched; only maker-authored prose is redacted.
 */
export function sanitizeModelForPersistence(model: AgentsExperienceModel): AgentsExperienceModel {
  return {
    ...model,
    agentSettings: {
      ...model.agentSettings,
      instructions: redactSecrets(model.agentSettings.instructions),
      raw: {},
    },
    tools: model.tools.map(tool => ({
      ...tool,
      displayName: redactOptional(tool.displayName),
      description: redactOptional(tool.description),
    })),
    skills: model.skills.map(skill => ({
      ...skill,
      markdown: redactSecrets(skill.markdown),
      body: redactSecrets(skill.body),
      frontmatterName: redactOptional(skill.frontmatterName),
      frontmatterDescription: redactOptional(skill.frontmatterDescription),
    })),
    ...(model.topics ? {
      topics: model.topics.map(topic => ({
        ...topic,
        description: redactOptional(topic.description),
        sourceText: redactStandardSource(topic.sourceText),
        componentContent: redactOptional(topic.componentContent),
        document: redactStandardDocument(topic.document),
        actions: topic.actions.map(action => ({ ...action, document: redactStandardDocument(action.document) })),
      })),
    } : {}),
    connectedAgents: model.connectedAgents.map(agent => ({
      ...agent,
      displayName: redactOptional(agent.displayName),
      description: redactOptional(agent.description),
    })),
    evaluationSets: model.evaluationSets.map(set => ({
      ...set,
      displayName: redactOptional(set.displayName),
      graderDetails: set.graderDetails?.map(grader => ({
        ...grader,
        name: redactOptional(grader.name),
        instructions: redactOptional(grader.instructions),
        // label.name is the outcome bucket's identifier (for example "Pass"), not maker prose.
        labels: grader.labels?.map(label => ({
          ...label,
          description: redactOptional(label.description),
          outcome: redactOptional(label.outcome),
        })),
      })),
    })),
    testCases: model.testCases.map(testCase => ({
      ...testCase,
      input: redactOptional(testCase.input),
      expected: redactOptional(testCase.expected),
      expectedKeywords: testCase.expectedKeywords?.map(redactSecrets),
    })),
    unknownKinds: model.unknownKinds.map(kind => ({
      ...kind,
      warning: redactSecrets(kind.warning),
    })),
  };
}
