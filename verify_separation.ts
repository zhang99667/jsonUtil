
import { performTransform } from './utils/transformations.ts';
import { TransformMode } from './types.ts';

const nestedJson = `
{
  "id": 1,
  "config": "{\\"theme\\": \\"dark\\"}"
}
`;

console.log("--- Format (Simple) Verification ---");
const formatResult = performTransform(nestedJson, TransformMode.FORMAT);
console.log(formatResult);

if (formatResult.includes('"config": "{\\"theme\\": \\"dark\\"}"')) {
    console.log("SUCCESS: Simple Format preserved nested string.");
} else {
    console.log("FAILURE: Simple Format expanded nested string or failed.");
    process.exit(1);
}

console.log("\n--- Deep Format Verification ---");
const deepFormatResult = performTransform(nestedJson, TransformMode.DEEP_FORMAT);
console.log(deepFormatResult);

if (deepFormatResult.includes('"theme": "dark"') && !deepFormatResult.includes('\\"theme\\"')) {
    console.log("SUCCESS: Deep Format expanded nested string.");
} else {
    console.log("FAILURE: Deep Format did not expand nested string.");
    process.exit(1);
}
