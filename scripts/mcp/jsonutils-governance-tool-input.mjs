import { jsonutilsGovernanceTools } from './jsonutils-governance-tool-definitions.mjs';

const toolByName = new Map(jsonutilsGovernanceTools.map(tool => [tool.name, tool]));
const isRecord = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export class JsonutilsGovernanceToolInputError extends Error {
  constructor() {
    super('Invalid tools/call parameters');
    this.name = 'JsonutilsGovernanceToolInputError';
  }
}

const invalid = () => { throw new JsonutilsGovernanceToolInputError(); };

export const assertJsonutilsGovernanceToolInput = (name, args) => {
  const tool = typeof name === 'string' ? toolByName.get(name) : undefined;
  if (!tool || !isRecord(args)) invalid();
  const schema = tool.inputSchema;
  const properties = schema.properties ?? {};
  if (schema.additionalProperties === false && Object.keys(args).some(key => !Object.hasOwn(properties, key))) invalid();
  for (const [key, value] of Object.entries(args)) {
    const property = properties[key];
    if (property?.type === 'integer' && (
      !Number.isInteger(value)
      || value < (property.minimum ?? Number.MIN_SAFE_INTEGER)
      || value > (property.maximum ?? Number.MAX_SAFE_INTEGER)
    )) invalid();
  }
  return tool;
};
