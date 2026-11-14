import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

const propertiesSchema = z.object({
  cafeteriaId: z.string().describe("The cafeteria to show the menu for"),
  date: z
    .string()
    .optional()
    .describe("ISO date; defaults to today in the user's time zone"),
})

export type IGetMenuCopilotComponentProperties = z.infer<typeof propertiesSchema>

export default zodToJsonSchema(propertiesSchema)
