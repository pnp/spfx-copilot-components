import { zavaCapabilities } from './capabilities';
import { getConfigurationDefault, zavaWebPartConfigurations } from './webPartConfigurations';

describe('Zava One web-part configuration catalog', () => {
  test('defines one complete profile for every business capability', () => {
    const intentKeys = zavaCapabilities.map((capability) => capability.intentKey).sort();
    const configuredKeys = Object.keys(zavaWebPartConfigurations).sort();

    expect(configuredKeys).toEqual(intentKeys);
    expect(configuredKeys).toHaveLength(35);
  });

  test('keeps every Top Action default inside its declared choices', () => {
    Object.keys(zavaWebPartConfigurations).forEach((intentKey) => {
      const definition = zavaWebPartConfigurations[intentKey];
      expect(definition.topActions.length).toBeGreaterThan(0);
      expect(definition.topActions.length).toBeLessThanOrEqual(2);
      definition.topActions.forEach((action) => {
        const keys = action.options.map((item) => item.key);
        expect(new Set(keys).size).toBe(keys.length);
        expect(keys).toContain(getConfigurationDefault(definition, action.property));
      });
    });
  });

  test('defines bounded lists and non-overlapping advanced settings', () => {
    Object.keys(zavaWebPartConfigurations).forEach((intentKey) => {
      const definition = zavaWebPartConfigurations[intentKey];
      const quickProperties = definition.topActions.map((action) => action.property);

      expect(definition.minItems).toBeGreaterThan(0);
      expect(definition.maxItems).toBeGreaterThanOrEqual(definition.minItems);
      expect(new Set(definition.advanced).size).toBe(definition.advanced.length);
      expect(definition.advanced.filter((property) => quickProperties.some((quickProperty) => quickProperty === property))).toHaveLength(0);
    });
  });

  test('uses explicit publisher-safe setting types', () => {
    Object.keys(zavaWebPartConfigurations).forEach((intentKey) => {
      const definition = zavaWebPartConfigurations[intentKey];
      expect(typeof definition.defaults.primaryView).toBe('string');
      expect(typeof definition.defaults.density).toBe('string');
      expect(typeof definition.defaults.maxItems).toBe('number');
      expect(typeof definition.defaults.showSource).toBe('boolean');
    });
  });

  test('keeps purpose-built Company defaults aligned with their experience controls', () => {
    expect(zavaWebPartConfigurations.companyNews.defaults).toMatchObject({ primaryView: 'editorial', scope: 'All' });
    expect(zavaWebPartConfigurations.companyNews.topActions[0]).toMatchObject({ property: 'primaryView', label: 'Layout' });
    expect(zavaWebPartConfigurations.companyNews.topActions[0].options.map((item) => item.key)).toEqual(['editorial', 'tiles', 'layers', 'carousel', 'filmstrip', 'compact']);
    expect(zavaWebPartConfigurations.companyEvents.topActions[0].options.map((item) => item.key)).toEqual(['calendar', 'agenda']);
    expect(zavaWebPartConfigurations.companyEvents.defaults).toMatchObject({ primaryView: 'calendar', maxItems: 5 });
    expect(zavaWebPartConfigurations.campusMenu.defaults.location).toBe('Helsinki');
    expect(zavaWebPartConfigurations.salesPerformance.defaults).toMatchObject({ filter: 'EMEA', scope: 'Q1 FY27' });
    expect(zavaWebPartConfigurations.goalsScorecards.topActions[0].options.map((item) => item.key)).toEqual(['Q1 FY27', 'FY27', 'Q4 FY26']);
    expect(zavaWebPartConfigurations.companyStock.topActions[0].options.map((item) => item.key)).toEqual(['1W', '1M', '3M', 'YTD', '1Y']);
    expect(zavaWebPartConfigurations.securityReporting.topActions[1].options.map((item) => item.key)).toContain('Other');
  });
});