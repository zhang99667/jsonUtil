
import { performInverseTransform } from './utils/transformations.ts';
import { TransformMode } from './types.ts';

const originalSource = `
{
  "id": 1,
  "config": "{\\"theme\\": \\"dark\\"}"
}
`;

// Simulate what the user sees in the preview (expanded nested JSON)
const expandedPreview = `
{
  "id": 1,
  "config": {
    "theme": "light" 
  }
}
`;
// Note: User changed "dark" to "light" in the expanded view.

console.log("--- Smart Inverse Verification ---");
// We want the result to be the original source structure (stringified config) but with the new value.
const result = performInverseTransform(expandedPreview, TransformMode.FORMAT, originalSource);
console.log(result);

if (result.includes('"config": "{\\"theme\\":\\"light\\"}"') || result.includes('"config": "{\\"theme\\": \\"light\\"}"')) {
    console.log("SUCCESS: Smart inverse preserved nested string structure and updated value.");
} else {
    console.log("FAILURE: Smart inverse did not preserve nested string structure.");
    process.exit(1);
}
