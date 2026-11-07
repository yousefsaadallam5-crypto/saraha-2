const createHttpException = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const badRequestException = (message = "Bad request") =>
  createHttpException(message, 400);
export const unauthorizedException = (message = "Unauthorized") =>
  createHttpException(message, 401);
export const forbiddenException = (message = "Forbidden") =>
  createHttpException(message, 403);
export const notFoundException = (message = "Not found") =>
  createHttpException(message, 404);
export const conflictException = (message = "Conflict") =>
  createHttpException(message, 409);

export const exceptions = Object.freeze({
  badRequest: badRequestException,
  unauthorized: unauthorizedException,
  forbidden: forbiddenException,
  notFound: notFoundException,
  conflict: conflictException,
});
