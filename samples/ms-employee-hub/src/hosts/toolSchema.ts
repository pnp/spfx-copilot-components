import { z } from 'zod';
import { fieldSpec } from './fields.js';

// This module is compiled for the SPFx packager, not imported by runtime entries.
export function toolSchema(entry: number, fields: readonly string[]): z.core.JSONSchema.JSONSchema {
  const shape: Record<string, z.ZodType> = {};
  for (const key of fields) {
    const spec = fieldSpec(entry, key);
    const primitive = spec.choices ? z.enum([...spec.choices]) : spec.kind === 'number' ? z.number() : spec.kind === 'boolean' ? z.boolean() : z.string();
    shape[key] = primitive.optional().describe(spec.description);
  }
  return z.toJSONSchema(z.strictObject(shape), { target: 'draft-7' });
}
