import { TransformMode } from '../types';
import { formatUnknownError } from '../utils/errors';
import { deepParseWithContext, parseJsonInput, performTransform } from '../utils/transformations';
import { parseJsonLines } from '../utils/jsonLines';
import { jsonValueToTypeScriptDeclaration } from '../utils/jsonToTypeScript';
import type {
  AppAsyncTransformWorkerRequest,
  AppAsyncTransformWorkerResponse,
} from '../utils/appAsyncTransformWorkerMessages';

const performWorkerJsonToTypeScriptTransform = (input: string): string => {
  const parsed = parseJsonInput(input);
  const jsonLines = parsed ? null : parseJsonLines(input);
  if (!parsed && !jsonLines) return input;

  const value = parsed ? parsed.value : jsonLines;
  return jsonValueToTypeScriptDeclaration(value, { includeSummary: true });
};

self.onmessage = (event: MessageEvent<AppAsyncTransformWorkerRequest>) => {
  const { id, input, mode, options } = event.data;

  try {
    if (mode === TransformMode.DEEP_FORMAT) {
      const result = deepParseWithContext(input, {
        autoExpandScheme: options?.autoExpandScheme,
      });
      const response: AppAsyncTransformWorkerResponse = {
        id,
        output: result.output,
        context: result.context,
      };
      self.postMessage(response);
      return;
    }

    if (mode === TransformMode.JSON_TO_TYPESCRIPT) {
      const response: AppAsyncTransformWorkerResponse = {
        id,
        output: performWorkerJsonToTypeScriptTransform(input),
      };
      self.postMessage(response);
      return;
    }

    const response: AppAsyncTransformWorkerResponse = {
      id,
      output: performTransform(input, mode),
    };
    self.postMessage(response);
  } catch (error) {
    const response: AppAsyncTransformWorkerResponse = {
      id,
      output: input,
      error: formatUnknownError(error),
    };
    self.postMessage(response);
  }
};

export {};
