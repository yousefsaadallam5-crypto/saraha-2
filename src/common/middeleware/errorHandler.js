export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const errorStatus = err.statusCode || err.status;
  let statusCode = 500;
  if (err.code === 11000) {
    statusCode = 409;
  } else if (err.name === "ValidationError" || err.name === "CastError") {
    statusCode = 400;
  } else if (
    Number.isInteger(errorStatus) &&
    errorStatus >= 400 &&
    errorStatus <= 599
  ) {
    statusCode = errorStatus;
  }
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    message:
      isProduction && statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
    ...(!isProduction ? { stack: err.stack } : {}),
  });
};