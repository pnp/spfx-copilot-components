import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"

const propertiesSchema = z.object({
  cafeteriaId: z
    .string()
    .describe("The cafeteria to show hours, contact, and payment details for"),
})

export type IGetCafeteriaDetailsCopilotComponentProperties = z.infer<typeof propertiesSchema>

export default zodToJsonSchema(propertiesSchema)
