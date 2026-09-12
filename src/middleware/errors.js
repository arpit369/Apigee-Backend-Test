// Unknown route -> 404.
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', path: req.originalUrl },
  });
}

// Bad JSON body (thrown by express.json) or any thrown error -> clean envelope.
// express.json sets err.type === 'entity.parse.failed' on malformed JSON.
function errorHandler(err, req, res, next) {
  const isBadJson = err.type === 'entity.parse.failed' || err.status === 400;
  const status = isBadJson ? 400 : err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: isBadJson ? 'BAD_REQUEST' : status === 500 ? 'INTERNAL_ERROR' : 'ERROR',
      message: isBadJson ? 'Invalid request data' : err.message || 'Something went wrong',
    },
  });
}

module.exports = { notFound, errorHandler };
