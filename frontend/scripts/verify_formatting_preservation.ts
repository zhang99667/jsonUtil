
import { performInverseTransform } from '../src/utils/transformations.ts';
import { TransformMode } from '../src/types.ts';

const minifiedSource = `{"id":1,"config":"{\\"theme\\":\\"dark\\"}"}`;
const formattedSource = `{
    "id": 1,
    "config": "{\\"theme\\": \\"dark\\"}"
}`; // 4 spaces indentation

const expandedPreview = `
{
  "id": 1,
  "config": {
    "theme": "light"
  }
}
`;

console.log("--- Minified Preservation ---");
const minifiedResult = performInverseTransform(expandedPreview, TransformMode.FORMAT, minifiedSource);
console.log(minifiedResult);

if (minifiedResult === `{"id":1,"config":"{\\"theme\\":\\"light\\"}"}`) {
    console.log("SUCCESS: Minified source preserved.");
} else {
    console.log("FAILURE: Minified source NOT preserved.");
    console.log("Expected:", `{"id":1,"config":"{\\"theme\\":\\"light\\"}"}`);
    console.log("Actual:  ", minifiedResult);
    process.exit(1);
}

console.log("\n--- Formatted Preservation ---");
const formattedResult = performInverseTransform(expandedPreview, TransformMode.FORMAT, formattedSource);
console.log(formattedResult);

// Note: The indentation detection is simple, it might pick up the first indentation it sees.
// In formattedSource, the first indentation is 4 spaces.
if (formattedResult.includes('    "id": 1') && formattedResult.includes('"config": "{\\"theme\\":\\"light\\"}"')) {
    console.log("SUCCESS: Formatted source preserved (4 spaces).");
} else {
    console.log("FAILURE: Formatted source NOT preserved.");
    process.exit(1);
}
