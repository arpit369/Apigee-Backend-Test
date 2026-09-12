// Minimal request logger. One line per request: method, path, status, ms.
module.exports = function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
    );
  });
  next();
};
