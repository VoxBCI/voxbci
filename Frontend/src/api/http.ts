import { API_BASE_URL } from './config';

/**
 * One failure type for the whole client. `status === 0` means the request never
 * reached the API (offline, wrong port, CORS) — the UI phrases that differently
 * from a 4xx the server actually produced.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }

  /** True when the API could not be reached at all. */
  get isOffline(): boolean {
    return this.status === 0;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Bearer token for authenticated routes. */
  token?: string | null;
  signal?: AbortSignal;
};

type ProblemDetails = {
  detail?: string;
  title?: string;
  code?: string;
  requestId?: string;
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Base URL, JSON encoding and problem+json decoding live here and nowhere else. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `Could not reach the VoxBCI API at ${API_BASE_URL}. Is the backend running?`,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? parseJson(text) : null;

  if (!response.ok) {
    const problem = (payload ?? {}) as ProblemDetails;

    throw new ApiError(
      response.status,
      problem.code ?? `HTTP_${response.status}`,
      problem.detail ?? problem.title ?? response.statusText ?? 'Request failed',
      problem.requestId,
    );
  }

  return payload as T;
}
