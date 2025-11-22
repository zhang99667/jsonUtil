
import { performTransform } from '../src/utils/transformations.ts';
import { TransformMode } from '../src/types.ts';

const nestedJson = `
{
  "id": 1,
  "config": "{\\"theme\\": \\"dark\\", \\"notifications\\": true}",
  "metadata": "{\\"created_at\\": \\"2023-01-01\\", \\"tags\\": [\\"a\\", \\"b\\"]}"
}
`;

console.log("--- Deep Parse Verification ---");
// Use FORMAT mode, which should now use deepParseJson
const result = performTransform(nestedJson, TransformMode.DEEP_FORMAT);
console.log(result);

if (result.includes('"theme": "dark"') && !result.includes('\\"theme\\"')) {
  console.log("SUCCESS: Nested JSON parsed correctly in FORMAT mode.");
} else {
  console.log("FAILURE: Nested JSON not parsed correctly in FORMAT mode.");
  process.exit(1);
}

const complexNested = `
{
  "level1": "{\\"level2\\": \\"{\\\\\\"level3\\\\\\": \\\\\\"value\\\\\\"}\\"}"
}
`;
console.log("\n--- Complex Nested Verification ---");
const complexResult = performTransform(complexNested, TransformMode.DEEP_FORMAT);
console.log(complexResult);

if (complexResult.includes('"level3": "value"')) {
  console.log("SUCCESS: Complex nested JSON parsed correctly.");
} else {
  console.log("FAILURE: Complex nested JSON not parsed correctly.");
  process.exit(1);
}
