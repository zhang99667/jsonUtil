import {
  buildJsonTreeModel,
  type BuildJsonTreeModelOptions,
  type JsonTreeModel,
} from '../utils/jsonTreeModel';

interface JsonTreeWorkerRequest {
  id: number;
  jsonData: string;
  options?: BuildJsonTreeModelOptions;
}

export interface JsonTreeWorkerResponse {
  id: number;
  model: JsonTreeModel | null;
  error?: string;
}

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
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

export {};
