import type { FastifyError, FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';

function problem(
  status: number,
  code: string,
  title: string,
  detail: string,
  requestId: string,
) {
  return {
    type: `https://voxbci.app/problems/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    detail,
    code,
    requestId,
  };
}

/**
 * One exit point for every error.
 *
 * Registered on the root instance (not inside a plugin) so it also catches
 * errors thrown before routing, and so route plugins cannot accidentally
 * half-encapsulate it.
 *
 * Clients always get RFC 9457 `application/problem+json`, including the request
 * id, so a user report can be matched to a log line without guesswork.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((request, reply) => {
    void reply
      .status(404)
      .type('application/problem+json')
      .send(
        problem(
          404,
          'NOT_FOUND',
          'Not found',
          `No route for ${request.method} ${request.url}`,
          request.id,
        ),
      );
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const requestId = request.id;

    if (error instanceof AppError) {
      return reply
        .status(error.status)
        .type('application/problem+json')
        .send(problem(error.status, error.code, error.title, error.message, requestId));
    }

    // Request validation (Zod schemas run through fastify-type-provider-zod).
    if (hasZodFastifySchemaValidationErrors(error)) {
      const detail = error.validation
        .map((item) => {
          const path = item.instancePath.replace(/^\//, '').replace(/\//g, '.');
          return `${path || '(body)'}: ${item.message}`;
        })
        .join('; ');

      return reply
        .status(400)
        .type('application/problem+json')
        .send(
          problem(400, 'VALIDATION_FAILED', 'Request validation failed', detail, requestId),
        );
    }

    if (error instanceof ZodError) {
      const detail = error.issues
        .map((issue) => `${issue.path.join('.') || '(body)'}: ${issue.message}`)
        .join('; ');

      return reply
        .status(400)
        .type('application/problem+json')
        .send(
          problem(400, 'VALIDATION_FAILED', 'Request validation failed', detail, requestId),
        );
    }

    // A response that does not match its declared schema is our bug, not the
    // client's — log it with the schema path and return a plain 500.
    if (isResponseSerializationError(error)) {
      request.log.error({ err: error, requestId }, 'response serialization failed');

      return reply
        .status(500)
        .type('application/problem+json')
        .send(
          problem(
            500,
            'RESPONSE_SERIALIZATION_FAILED',
            'Internal server error',
            'The response did not match its schema. Check the server logs.',
            requestId,
          ),
        );
    }

    const status = error.statusCode;

    if (status && status >= 400 && status < 500) {
      return reply
        .status(status)
        .type('application/problem+json')
        .send(problem(status, 'REQUEST_REJECTED', 'Request rejected', error.message, requestId));
    }

    request.log.error({ err: error, requestId }, 'unhandled error');

    return reply
      .status(500)
      .type('application/problem+json')
      .send(
        problem(
          500,
          'INTERNAL_ERROR',
          'Internal server error',
          'Something went wrong. Check the server logs with this requestId.',
          requestId,
        ),
      );
  });
}
