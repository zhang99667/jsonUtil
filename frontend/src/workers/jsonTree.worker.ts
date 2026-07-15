import { buildJsonTreeModel } from '../utils/jsonTreeModel';
import { formatUnknownError } from '../utils/errors';
import type { JsonTreeWorkerRequest, JsonTreeWorkerResponse } from '../utils/jsonTreeWorker';

self.onmessage = (event: MessageEvent<JsonTreeWorkerRequest>) => {
  const { id, jsonData, options } = event.data;

  try {
    const response: JsonTreeWorkerResponse = {
      id,
      model: buildJsonTreeModel(jsonData, options),
    };
    self.postMessage(response);
  } catch (error) {
    const response: JsonTreeWorkerResponse = {
      id,
      model: null,
      error: formatUnknownError(error),
    };
    self.postMessage(response);
  }
};

export {};
