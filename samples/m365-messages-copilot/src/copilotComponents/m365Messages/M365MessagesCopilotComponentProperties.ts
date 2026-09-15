export interface IM365MessagesCopilotComponentProperties {
  top?: number;
  search?: string;
  filter?: string;
}

const propertiesSchema = {
  type: 'object',
  properties: {
    top: {
      type: 'integer',
      description: 'Initial number of service messages to load. Defaults to 25.'
    },
    search: {
      type: 'string',
      description: 'Optional initial Microsoft Graph search phrase.'
    },
    filter: {
      type: 'string',
      description: 'Optional initial Microsoft Graph OData filter expression.'
    }
  }
} as const;

export default propertiesSchema;
