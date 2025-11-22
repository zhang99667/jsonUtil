
import { performTransform } from '../src/utils/transformations.ts';
import { TransformMode } from '../src/types.ts';

const nestedJson = `
{
  "id": 1,
  "config": "{\\"theme\\": \\"dark\\", \\"notifications\\": true}",
  "metadata": "{\\"created_at\\": \\"2023-01-01\\", \\"tags\\": [\\"a\\", \\"b\\"]}"
}
`;

console.log("--- Nested Parse ---");
const result = performTransform(nestedJson, TransformMode.DEEP_FORMAT);
console.log(result);

if (result.includes('"theme": "dark"') && !result.includes('\\"theme\\"')) {
  console.log("SUCCESS: Nested JSON parsed correctly.");
} else {
  console.log("FAILURE: Nested JSON not parsed correctly.");
  process.exit(1);
}
