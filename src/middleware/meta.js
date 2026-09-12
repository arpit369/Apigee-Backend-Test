const crypto = require('crypto');
const { SERVER_ID } = require('../config');

// Stamp serverId + requestId + timestamp onto every JSON object response.
// - serverId proves which backend handled it (load balancing / target servers).
// - requestId echoes an incoming X-Request-Id or generates one (distributed tracing).
// - timestamp lets you SEE Response Cache freeze a value.
module.exports = function meta(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Server-Id', SERVER_ID);

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      body.meta = { serverId: SERVER_ID, requestId, timestamp: new Date().toISOString() };
      // Keep top-level serverId too, for the simple LB demo from before.
      body.serverId = SERVER_ID;
    }
    return sendJson(body);
  };
  next();
};
