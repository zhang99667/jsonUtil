
const nestedJson = `
{
  "id": 1,
  "config": "{\\"theme\\": \\"dark\\", \\"notifications\\": true}",
  "metadata": "{\\"created_at\\": \\"2023-01-01\\", \\"tags\\": [\\"a\\", \\"b\\"]}"
}
`;

const simpleParse = (input: string) => {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return "Error parsing";
    }
};

console.log("--- Simple Parse ---");
console.log(simpleParse(nestedJson));

// Desired output should have "config" and "metadata" as objects, not strings.
