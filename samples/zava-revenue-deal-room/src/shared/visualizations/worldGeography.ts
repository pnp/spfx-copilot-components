import { geoEqualEarth, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import { z } from 'zod';
import world from 'world-atlas/countries-110m.json';

const geometryMetadata = { id: z.string().optional(), properties: z.object({ name: z.string() }).optional() };
const topology = z.object({
  type: z.literal('Topology'),
  transform: z.object({ scale: z.tuple([z.number(), z.number()]), translate: z.tuple([z.number(), z.number()]) }),
  arcs: z.array(z.array(z.tuple([z.number(), z.number()]))),
  objects: z.object({ countries: z.object({
    type: z.literal('GeometryCollection'),
    geometries: z.array(z.union([
      z.object({ ...geometryMetadata, type: z.literal('Polygon'), arcs: z.array(z.array(z.number())) }),
      z.object({ ...geometryMetadata, type: z.literal('MultiPolygon'), arcs: z.array(z.array(z.array(z.number()))) }),
      z.object({ ...geometryMetadata, type: z.literal('GeometryCollection'), geometries: z.array(z.never()) })
    ]))
  }) })
}).parse(world);

export type WorldCountryFeature = Feature<Geometry, { name?: string }>;
const decodedCountries = feature(topology, topology.objects.countries);
export const WORLD_COUNTRIES: FeatureCollection<Geometry, { name?: string }> = {
  type: 'FeatureCollection',
  features: decodedCountries.features.map(country => ({ ...country, properties: country.properties || {} }))
};
export const REVENUE_WORLD_COUNTRIES: FeatureCollection<Geometry, { name?: string }> = {
  type: 'FeatureCollection',
  features: WORLD_COUNTRIES.features.filter(country => Number(country.id) !== 10)
};

export function worldCountry(atlasId: number): WorldCountryFeature | undefined {
  return WORLD_COUNTRIES.features.find(country => Number(country.id) === atlasId);
}

export function countryWorldProjection(): GeoProjection {
  return geoEqualEarth().fitExtent([[12, 10], [708, 292]], REVENUE_WORLD_COUNTRIES);
}

export function focusedCountryProjection(country: WorldCountryFeature): GeoProjection {
  return geoNaturalEarth1().fitExtent([[16, 12], [284, 188]], country);
}

export function worldCountryPath(country: WorldCountryFeature, projection: GeoProjection): string {
  return geoPath(projection)(country) || '';
}
