import { TransformMode } from '../types';
import type { TransformContext } from '../types';
import { deepParseWithContext, parseJsonInput, performTransform } from '../utils/transformations';
import { parseJsonLines } from '../utils/jsonLines';
import { jsonValueToTypeScriptDeclaration } from '../utils/jsonToTypeScript';

interface TransformWorkerRequest {
  id: number;
  input: string;
  mode: TransformMode;
  options?: {
    autoExpandScheme?: boolean;
  };
}

export interface TransformWorkerResponse {
  id: number;
  output: string;
  context?: TransformContext;
  error?: string;
}

const performWorkerJsonToTypeScriptTransform = (input: string): string => {
  const parsed = parseJsonInput(input);
  const jsonLines = parsed ? null : parseJsonLines(input);
  if (!parsed && !jsonLines) return input;

  const value = parsed ? parsed.value : jsonLines;
  return jsonValueToTypeScriptDeclaration(value, { includeSummary: true });
};

self.onmessage = (event: MessageEvent<TransformWorkerRequest>) => {
  const { id, input, mode, options } = event.data;

  try {
    if (mode === TransformMode.DEEP_FORMAT) {
      const result = deepParseWithContext(input, {
        autoExpandScheme: options?.autoExpandScheme,
      });
      const response: TransformWorkerResponse = {
        id,
        output: result.output,
        context: result.context,
      };
      self.postMessage(response);
      return;
    }

    if (mode === TransformMode.JSON_TO_TYPESCRIPT) {
      const response: TransformWorkerResponse = {
        id,
        output: performWorkerJsonToTypeScriptTransform(input),
      };
      self.postMessage(response);
      return;
    }

    const response: TransformWorkerResponse = {
      id,
      output: performTransform(input, mode),
    };
    self.postMessage(response);
  } catch (error) {
    const response: TransformWorkerResponse = {
      id,
      output: input,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
