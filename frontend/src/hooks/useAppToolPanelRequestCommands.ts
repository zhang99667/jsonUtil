import { useCallback, useRef, useState } from 'react';
import type { JsonPathQueryItem } from '../utils/jsonPathQuery';
import {
  buildJsonPathQueryRequest,
  buildJsonTreeFocusRequest,
  buildSchemeInputRequest,
  buildTemplateFillRequest,
  type JsonPathQueryRequest,
  type JsonTreeFocusRequest,
  type SchemeInputRequest,
  type TemplateFillRequest,
} from '../utils/appToolPanelCommandPlans';

export const useAppToolPanelRequestCommands = () => {
  const [jsonPathQueryRequest, setJsonPathQueryRequest] = useState<JsonPathQueryRequest | null>(null);
  const [jsonTreeFocusRequest, setJsonTreeFocusRequest] = useState<JsonTreeFocusRequest | null>(null);
  const [schemeInputRequest, setSchemeInputRequest] = useState<SchemeInputRequest | null>(null);
  const [templateFillRequest, setTemplateFillRequest] = useState<TemplateFillRequest | null>(null);
  const jsonPathQueryRequestIdRef = useRef(0);
  const jsonTreeFocusRequestIdRef = useRef(0);
  const schemeInputRequestIdRef = useRef(0);
  const templateFillRequestIdRef = useRef(0);

  const requestJsonPathQuery = useCallback((query: string): JsonPathQueryRequest | null => {
    const plan = buildJsonPathQueryRequest(jsonPathQueryRequestIdRef.current, query);
    if (!plan) return null;

    jsonPathQueryRequestIdRef.current = plan.nextId;
    setJsonPathQueryRequest(plan.request);
    return plan.request;
  }, []);

  const requestJsonTreeFocus = useCallback((item: JsonPathQueryItem): JsonTreeFocusRequest => {
    const plan = buildJsonTreeFocusRequest(jsonTreeFocusRequestIdRef.current, item);
    jsonTreeFocusRequestIdRef.current = plan.nextId;
    setJsonTreeFocusRequest(plan.request);
    return plan.request;
  }, []);

  const requestSchemeInput = useCallback((value: string): SchemeInputRequest => {
    const plan = buildSchemeInputRequest(schemeInputRequestIdRef.current, value);
    schemeInputRequestIdRef.current = plan.nextId;
    setSchemeInputRequest(plan.request);
    return plan.request;
  }, []);

  const requestTemplateFill = useCallback((template: string): TemplateFillRequest | null => {
    const plan = buildTemplateFillRequest(templateFillRequestIdRef.current, template);
    if (!plan) return null;

    templateFillRequestIdRef.current = plan.nextId;
    setTemplateFillRequest(plan.request);
    return plan.request;
  }, []);

  return {
    jsonPathQueryRequest,
    jsonTreeFocusRequest,
    requestJsonPathQuery,
    requestJsonTreeFocus,
    requestSchemeInput,
    requestTemplateFill,
    schemeInputRequest,
    templateFillRequest,
  };
};
