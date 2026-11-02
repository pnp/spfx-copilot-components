import { REVENUE_COUNTRIES } from '../countryRevenue';
import { WORLD_COUNTRIES, REVENUE_WORLD_COUNTRIES, countryWorldProjection, focusedCountryProjection, worldCountry, worldCountryPath } from './worldGeography';

describe('typed offline world-atlas country joins', () => {
  it('validates bundled topology and preserves the shared full world for existing charts', () => {
    expect(WORLD_COUNTRIES.type).toBe('FeatureCollection');
    expect(WORLD_COUNTRIES.features.length).toBeGreaterThan(170);
    expect(worldCountry(10)).toBeDefined();
    expect(REVENUE_WORLD_COUNTRIES.features.some(country => Number(country.id) === 10)).toBe(false);
    expect(worldCountry(999999)).toBeUndefined();
    expect(WORLD_COUNTRIES.features.every(country => country.properties !== undefined)).toBe(true);
    const identities = WORLD_COUNTRIES.features.map(country => country.id === undefined ? `name-${country.properties.name}` : `id-${country.id}`);
    expect(new Set(identities).size).toBe(WORLD_COUNTRIES.features.length);
    const unnamedIds = WORLD_COUNTRIES.features.filter(country => country.id === undefined);
    expect(unnamedIds.map(country => country.properties.name).sort()).toEqual(['Kosovo', 'N. Cyprus', 'Somaliland']);
  });

  it('joins all 24 ISO2 catalog countries to the exact numeric atlas IDs, including zero-padded IDs', () => {
    expect(worldCountry(36)?.properties?.name).toBe('Australia');
    expect(worldCountry(76)?.properties?.name).toBe('Brazil');
    expect(worldCountry(840)?.properties?.name).toBe('United States of America');
    const projection = countryWorldProjection();
    REVENUE_COUNTRIES.forEach(country => {
      const geometry = worldCountry(country.atlasId);
      expect(geometry).toBeDefined();
      if (!geometry) throw new Error(`Missing ${country.id} geometry`);
      expect(['Polygon', 'MultiPolygon']).toContain(geometry.geometry.type);
      const overview = worldCountryPath(geometry, projection);
      const detail = worldCountryPath(geometry, focusedCountryProjection(geometry));
      expect(overview.length).toBeGreaterThan(10);
      expect(detail.length).toBeGreaterThan(10);
      expect(`${overview}${detail}`).not.toMatch(/NaN|Infinity/);
      const point = projection([country.longitude, country.latitude]);
      expect(point?.every(Number.isFinite)).toBe(true);
      expect(point?.[0]).toBeGreaterThanOrEqual(0);
      expect(point?.[0]).toBeLessThanOrEqual(720);
      expect(point?.[1]).toBeGreaterThanOrEqual(0);
      expect(point?.[1]).toBeLessThanOrEqual(300);
    });
  });
});
