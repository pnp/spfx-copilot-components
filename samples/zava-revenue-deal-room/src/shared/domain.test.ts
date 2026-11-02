import { INTENTS } from './catalog';
import { ACCOUNTS, CONTACTS, OPPORTUNITIES, HERO_EVIDENCE, calculateCommercialOffer } from './domain';

describe('revenue domain', () => {
  it('keeps the approved catalog unique and complete', () => {
    expect(INTENTS).toHaveLength(27);
    expect(new Set(INTENTS.map((item) => item.key)).size).toBe(27);
    expect(new Set(INTENTS.map((item) => item.route)).size).toBe(27);
    expect(INTENTS.filter((item) => item.operation === 'education')).toHaveLength(1);
  });

  it('provides the committed deterministic graph sizes and valid relationships', () => {
    expect(ACCOUNTS).toHaveLength(80);
    expect(CONTACTS).toHaveLength(260);
    expect(OPPORTUNITIES).toHaveLength(120);
    const accountIds = new Set(ACCOUNTS.map((account) => account.id));
    expect(CONTACTS.every((contact) => accountIds.has(contact.accountId))).toBe(true);
    expect(OPPORTUNITIES.every((opportunity) => accountIds.has(opportunity.accountId))).toBe(true);
    expect(OPPORTUNITIES.some((opportunity) => opportunity.id === 'ZDR-2042')).toBe(true);
    expect(HERO_EVIDENCE.every((evidence) => evidence.opportunityId === 'ZDR-2042')).toBe(true);
  });

  it('materially changes economics and authority with scenario inputs', () => {
    const base = calculateCommercialOffer({ quantity: 860, termMonths: 36, discount: 8, services: 300000, probability: 0.68 });
    const protectedRamp = calculateCommercialOffer({ quantity: 1040, termMonths: 36, discount: 20, services: 480000, probability: 0.76 });
    expect(base.contractValue).not.toBe(protectedRamp.contractValue);
    expect(base.grossMargin).not.toBe(protectedRamp.grossMargin);
    expect(base.authority).not.toBe(protectedRamp.authority);
    expect(base.weightedForecast).not.toBe(protectedRamp.weightedForecast);
  });
});