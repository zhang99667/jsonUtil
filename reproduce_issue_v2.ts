// Copied logic from src/utils/transformations.ts to avoid import issues

const TransformMode = {
    NONE: 'NONE',
    FORMAT: 'FORMAT',
    DEEP_FORMAT: 'DEEP_FORMAT',
    MINIFY: 'MINIFY',
    ESCAPE: 'ESCAPE',
    UNESCAPE: 'UNESCAPE',
    UNICODE_TO_CN: 'UNICODE_TO_CN',
    CN_TO_UNICODE: 'CN_TO_UNICODE'
} as const;
type TransformMode = typeof TransformMode[keyof typeof TransformMode];

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

const validateJson = (input: string): ValidationResult => {
    if (typeof input !== 'string' || !input.trim()) return { isValid: true };
    try {
        JSON.parse(input);
        return { isValid: true };
    } catch (e: any) {
        return { isValid: false, error: e.message };
    }
};

const minifyJson = (input: string): string => {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed);
    } catch (e) {
        return input;
    }
};

const deepParseJson = (input: string): string => {
    try {
        const parsed = JSON.parse(input);

        const deepParse = (obj: any): any => {
            if (typeof obj === 'string') {
                try {
                    const innerParsed = JSON.parse(obj);
                    if (typeof innerParsed === 'object' && innerParsed !== null) {
                        return deepParse(innerParsed);
                    }
                    return obj;
                } catch (e) {
                    return obj;
                }
            }

            if (Array.isArray(obj)) {
                return obj.map(item => deepParse(item));
            }

            if (typeof obj === 'object' && obj !== null) {
                const newObj: any = {};
                for (const key in obj) {
                    newObj[key] = deepParse(obj[key]);
                }
                return newObj;
            }

            return obj;
        };

        const result = deepParse(parsed);
        return JSON.stringify(result, null, 2);
    } catch (e) {
        return input;
    }
};

const detectIndentation = (jsonString: string): number | string => {
    const lines = jsonString.split('\n');
    if (lines.length <= 1) return 0;

    for (const line of lines) {
        if (line.trim() !== '') {
            const match = line.match(/^(\s+)/);
            if (match) {
                return match[1];
            }
        }
    }
    return 2;
};

const smartInverse = (output: string, originalInput: string): string => {
    try {
        const outputObj = JSON.parse(output);
        const originalObj = JSON.parse(originalInput);

        const deepMerge = (out: any, orig: any): any => {
            if (typeof orig === 'string' && typeof out === 'object' && out !== null) {
                return JSON.stringify(out);
            }

            if (Array.isArray(out) && Array.isArray(orig)) {
                return out.map((item, index) => {
                    if (index < orig.length) {
                        return deepMerge(item, orig[index]);
                    }
                    return item;
                });
            }

            if (typeof out === 'object' && out !== null && typeof orig === 'object' && orig !== null) {
                const newObj: any = {};
                for (const key in out) {
                    if (key in orig) {
                        newObj[key] = deepMerge(out[key], orig[key]);
                    } else {
                        newObj[key] = out[key];
                    }
                }
                return newObj;
            }

            return out;
        };

        const result = deepMerge(outputObj, originalObj);
        const indentation = detectIndentation(originalInput);

        if (indentation === 0) {
            return JSON.stringify(result);
        }
        return JSON.stringify(result, null, indentation);
    } catch (e) {
        try {
            const parsed = JSON.parse(output);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return output;
        }
    }
};

const escapeString = (input: string): string => {
    return JSON.stringify(input).slice(1, -1);
};

const unescapeString = (input: string): string => {
    try {
        if (input.startsWith('"') && input.endsWith('"')) {
            return JSON.parse(input);
        }
        return JSON.parse(`"${input}"`);
    } catch (e) {
        try {
            const parsed = JSON.parse(input);
            if (typeof parsed !== 'string') {
                return JSON.stringify(parsed);
            }
            return parsed;
        } catch { return input; }
    }
};

const cnToUnicode = (input: string): string => {
    return input.split('').map(char => {
        const code = char.charCodeAt(0);
        return code > 255
            ? '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
            : char;
    }).join('');
};

const unicodeToCn = (input: string): string => {
    return input.replace(/\\u([\dA-Fa-f]{4})/gi, (_, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });
};

const performInverseTransform = (output: string, mode: TransformMode, originalInput?: string): string => {
    if (!output) return '';
    try {
        switch (mode) {
            case TransformMode.NONE: return output;
            case TransformMode.FORMAT: return minifyJson(output);
            case TransformMode.DEEP_FORMAT:
                if (originalInput) {
                    return smartInverse(output, originalInput);
                }
                return minifyJson(output);
            case TransformMode.MINIFY: return output;

            case TransformMode.ESCAPE: return unescapeString(output);
            case TransformMode.UNESCAPE: return escapeString(output);

            case TransformMode.UNICODE_TO_CN: return cnToUnicode(output);
            case TransformMode.CN_TO_UNICODE: return unicodeToCn(output);
            default: return output;
        }
    } catch (e) {
        return output;
    }
};

// --- Tests ---

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
    "{\"a\": 1, \"b\": \"invalid json string\"}"
];

deepTestCases.forEach(input => {
    const validation = validateJson(input);
    if (validation.isValid) {
        const output = performInverseTransform(input, TransformMode.DEEP_FORMAT, original);
        console.log(`Input: '${input}'`);
        console.log(`  Inverse (DEEP_FORMAT): '${output}'`);
    }
});
