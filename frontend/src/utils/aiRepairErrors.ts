export enum AiRepairErrorCode {
  ApiKeyRequired = 'api_key_required',
  CustomBaseUrlRequired = 'custom_base_url_required',
  BaseUrlInvalid = 'base_url_invalid',
  ProviderAuth = 'provider_auth',
  ProviderEndpoint = 'provider_endpoint',
  ProviderRateLimit = 'provider_rate_limit',
  ProviderUnavailable = 'provider_unavailable',
  ProviderApiError = 'provider_api_error',
  Network = 'network',
  Timeout = 'timeout',
  InvalidResponse = 'invalid_response',
  EmptyResponse = 'empty_response',
  SensitiveInput = 'sensitive_input',
  InputTooLarge = 'input_too_large',
  ConnectionTestInvalid = 'connection_test_invalid',
  ConnectionTestTimeout = 'connection_test_timeout',
  Unknown = 'unknown',
}

export class AiRepairError extends Error {
  readonly code: AiRepairErrorCode;

  constructor(code: AiRepairErrorCode, message: string) {
    super(message);
    this.name = 'AiRepairError';
    this.code = code;
  }
}

const AI_REPAIR_ERROR_CODES = new Set<string>(Object.values(AiRepairErrorCode));

export const createAiRepairError = (
  code: AiRepairErrorCode,
  message: string
): AiRepairError => new AiRepairError(code, message);

export const isAiRepairError = (error: unknown): error is AiRepairError => (
  error instanceof Error && isAiRepairErrorCode((error as { code?: unknown }).code)
);

export const getAiRepairErrorCode = (error: unknown): AiRepairErrorCode | null => (
  isAiRepairError(error) ? error.code : null
);

const isAiRepairErrorCode = (code: unknown): code is AiRepairErrorCode => (
  typeof code === 'string' && AI_REPAIR_ERROR_CODES.has(code)
);
