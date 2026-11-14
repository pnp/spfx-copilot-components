import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

const propertiesSchema = z.object({
  query: z.string().optional().describe('Dish name or keyword, e.g. "paneer"'),
  dietaryTags: z
    .array(
      z.enum([
        "Vegetarian",
        "Vegan",
        "Halal",
        "Jain",
        "GlutenFree",
        "NutFree",
        "Contains Egg",
      ]),
    )
    .optional()
    .describe("Dietary requirements the dish must satisfy"),
  maxPrice: z
    .number()
    .optional()
    .describe("Maximum price per item in local currency"),
  cafeteriaId: z
    .string()
    .optional()
    .describe("Restrict results to one cafeteria"),
  date: z
    .string()
    .optional()
    .describe("ISO date; defaults to today in the user's time zone"),
})

export type ISearchMenuItemsCopilotComponentProperties = z.infer<typeof propertiesSchema>

export default zodToJsonSchema(propertiesSchema)
