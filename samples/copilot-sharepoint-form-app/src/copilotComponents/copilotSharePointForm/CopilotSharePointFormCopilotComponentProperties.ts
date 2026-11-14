/**
 * Tool arguments for OpenDocumentSubmissionForm. Copilot fills them from the conversation.
 * Only string properties are supported. Constraint keywords (.min, .max, .regex, .default)
 * must not be used: file size and extensions are checked when the person submits.
 * This tool does not accept a file. The person chooses the file in the form.
 */
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

const propertiesSchema = z.object({
  siteUrl: z
    .string()
    .optional()
    .describe(
      "Optional. Absolute HTTPS URL of the SharePoint site on the current tenant that holds the document library, for example " +
        "https://contoso.sharepoint.com/sites/policies. Pass the site URL only, without a page or library path. " +
        "If they did not give a URL, omit this or pass an empty string. Do not ask for the site URL before calling this tool. " +
        "Never guess or invent a URL. This tool does not accept a file."
    ),
  libraryName: z
    .string()
    .optional()
    .describe(
      "Optional. Name of the target document library, such as Policies or Records. " +
        "Pass this when the person names a library. It overrides libraryTitle. " +
        "If they did not name one, omit it. Do not ask for the library before calling this tool. " +
        "This tool does not accept a file."
    ),
  libraryTitle: z
    .string()
    .optional()
    .describe(
      "Optional. Title of the single target document library, such as Documents or Policies. " +
        "Use the library the person named. If they did not name one, omit it and the form defaults to Documents. " +
        "Do not ask for the library before calling this tool. " +
        "This tool does not accept a file, file bytes, or document text."
    ),
  maxFileSizeMb: z
    .string()
    .optional()
    .describe(
      "Optional maximum file size in megabytes, as digits, from 1 to 50. Omit it to use 50. " +
        "Do not pass a file. The form's own file picker enforces the limit."
    ),
  allowedExtensions: z
    .string()
    .optional()
    .describe(
      "Optional. Omit this or pass an empty string unless the person explicitly asks to restrict file types to a subset of " +
        ".pdf,.docx,.xlsx,.pptx,.md,.png,.jpg. Only .pdf, .docx, .xlsx, .pptx, .md (.markdown), .png, and .jpg are allowed. " +
        "Including .md also allows .markdown, and including .markdown also allows .md. Do not pass a file."
    )
});

export type ICopilotSharePointFormCopilotComponentProperties = z.infer<typeof propertiesSchema>;

const rawSchema = zodToJsonSchema(propertiesSchema) as {
  properties?: { [name: string]: unknown };
};

/**
 * Copilot drops a tool whose schema carries draft-07 extras. Both the function
 * parameters and the MCP inputSchema must be only type and properties.
 */
const toolParameters: {
  type: "object";
  properties: { [name: string]: unknown };
} = {
  type: "object",
  properties: rawSchema.properties || {}
};

export default toolParameters;
