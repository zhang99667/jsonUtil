
import { validateJson, performInverseTransform } from './src/utils/transformations.ts';
// Mock TransformMode locally
enum TransformMode {
    NONE = 'NONE',
    FORMAT = 'FORMAT',
    DEEP_FORMAT = 'DEEP_FORMAT',
    MINIFY = 'MINIFY',
    ESCAPE = 'ESCAPE',
    UNESCAPE = 'UNESCAPE',
    UNICODE_TO_CN = 'UNICODE_TO_CN',
    CN_TO_UNICODE = 'CN_TO_UNICODE'
}

const testCases = [
    "",
    " ",
    "{",
    "}",
    "{\"a\": 1,}",
    "{\"a\":",
    "1",
    "\"string\"",
    "true",
    "null",
    "[]",
    "{}"
];

console.log("Testing Validation and Inverse Transform (FORMAT Mode):");
testCases.forEach(input => {
    const validation = validateJson(input);
    console.log(`Input: '${input}'`);
    console.log(`  Valid: ${validation.isValid}`);

    if (validation.isValid) {
        const output = performInverseTransform(input, TransformMode.FORMAT);
        console.log(`  Inverse (FORMAT): '${output}'`);
    } else {
        console.log(`  Skipped Inverse (Invalid)`);
    }
    console.log("---");
});

console.log("\nTesting DEEP_FORMAT Mode (Smart Inverse):");
const original = '{"a": 1, "b": {"c": 2}}';
const deepTestCases = [
    "{}",
    "{\"a\": 1}",
    "{\"a\": 1, \"b\": {}}",
    "{\"a\": 1, \"b\": \"invalid json string\"}" // valid json, but b is string now
];

deepTestCases.forEach(input => {
    const validation = validateJson(input);
    if (validation.isValid) {
        const output = performInverseTransform(input, TransformMode.DEEP_FORMAT, original);
        console.log(`Input: '${input}'`);
        console.log(`  Inverse (DEEP_FORMAT): '${output}'`);
    }
});
