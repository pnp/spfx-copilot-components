import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

const propertiesSchema = z.object({
  openNow: z
    .boolean()
    .optional()
    .describe("Only show cafeterias that are open right now"),
  building: z
    .string()
    .optional()
    .describe('Restrict results to one building, e.g. "Building 4"'),
})

export type IGetListCafeteriaCopilotComponentProperties = z.infer<typeof propertiesSchema>

export default zodToJsonSchema(propertiesSchema)
