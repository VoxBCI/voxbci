/**
 * Errors the API returns on purpose.
 *
 * Anything thrown as an `AppError` reaches the client as RFC 9457
 * `application/problem+json`; anything else is logged and reported as a 500.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;

  constructor(options: {
    status: number;
    code: string;
    title?: string;
    message: string;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = 'AppError';
    this.status = options.status;
    this.code = options.code;
    this.title = options.title ?? DEFAULT_TITLES[options.status] ?? 'Error';
  }
}

const DEFAULT_TITLES: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  429: 'Too many requests',
  501: 'Not implemented',
  500: 'Internal server error',
};

export const Errors = {
  unauthorized: (detail = 'Missing or expired access token') =>
    new AppError({ status: 401, code: 'UNAUTHORIZED', message: detail }),

  forbidden: (detail = 'You do not have access to this resource') =>
    new AppError({ status: 403, code: 'FORBIDDEN', message: detail }),

  notFound: (detail = 'Resource not found') =>
    new AppError({ status: 404, code: 'NOT_FOUND', message: detail }),

  conflict: (code: string, detail: string) => new AppError({ status: 409, code, message: detail }),

  notImplemented: (detail: string) =>
    new AppError({ status: 501, code: 'NOT_IMPLEMENTED', message: detail }),
} as const;
