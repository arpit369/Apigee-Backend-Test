// Diagnostic harness — httpbin-style endpoints so every Apigee policy has
// something concrete to test against. Each route's comment names the policy.
const express = require('express');
const router = express.Router();
const { MAX_DELAY_SECONDS, MAX_LARGE_COUNT, SERVER_ID } = require('../config');

// ECHO — reflects everything Apigee forwarded. The single most useful endpoint:
// see injected headers, stripped auth, rewritten paths, CORS, AssignMessage, etc.
router.all('/echo', (req, res) => {
  res.json({
    success: true,
    service: 'diagnostics',
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    headers: req.headers,
    body: req.body,
    ip: req.ip,
    protocol: req.protocol,
  });
});

// HEADERS — just what the backend received. Verify security-header / AssignMessage policies.
router.get('/headers', (req, res) => res.json({ success: true, headers: req.headers }));

// IP — client IP as seen after trust-proxy. Test X-Forwarded-For / IP access control.
router.get('/ip', (req, res) =>
  res.json({ success: true, ip: req.ip, xForwardedFor: req.headers['x-forwarded-for'] || null })
);

// STATUS — force any HTTP status. Test FaultRules, RaiseFault, target error mapping,
// and load-balancer/health failover behavior.
router.all('/status/:code', (req, res) => {
  const code = parseInt(req.params.code, 10);
  if (isNaN(code) || code < 100 || code > 599) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'code must be 100-599' } });
  }
  res.status(code).json({ success: code < 400, service: 'diagnostics', requestedStatus: code });
});

// DELAY — hold the response N seconds (capped). Test target timeouts, Spike Arrest,
// Concurrent Rate Limit, and circuit-breaker behavior.
router.all('/delay/:seconds', (req, res) => {
  let secs = parseFloat(req.params.seconds);
  if (isNaN(secs) || secs < 0) secs = 0;
  secs = Math.min(secs, MAX_DELAY_SECONDS);
  setTimeout(() => res.json({ success: true, service: 'diagnostics', delayedSeconds: secs }), secs * 1000);
});

// XML — an XML response. Test XMLToJSON / JSONToXML mediation and XML threat protection.
router.get('/data/xml', (req, res) => {
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <service>diagnostics</service>
  <serverId>${SERVER_ID}</serverId>
  <items>
    <item><id>1</id><name>Alpha</name></item>
    <item><id>2</id><name>Beta</name></item>
  </items>
</response>`
  );
});

// LARGE — a big JSON array (capped). Test message-size threat protection,
// Response Cache size limits, and payload streaming.
router.get('/data/large', (req, res) => {
  const count = Math.min(parseInt(req.query.count, 10) || 100, MAX_LARGE_COUNT);
  res.json({
    success: true,
    service: 'diagnostics',
    count,
    items: Array.from({ length: count }, (_, i) => ({ id: i + 1, value: `item-${i + 1}` })),
  });
});

// VALIDATE — requires {name, email}. Returns 400 with field list otherwise.
// Test MessageValidation, ExtractVariables + RaiseFault, JSON schema policies.
router.post('/validate', (req, res) => {
  const { name, email } = req.body || {};
  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (missing.length) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Missing required fields', fields: missing },
    });
  }
  res.json({ success: true, service: 'diagnostics', message: 'Validation passed', received: { name, email } });
});

// CACHE/TIME — returns a fresh timestamp + random each call. With Apigee Response
// Cache attached, the value FREEZES until TTL expires — visible proof caching works.
router.get('/cache/time', (req, res) =>
  res.json({ success: true, service: 'diagnostics', timestamp: Date.now(), random: Math.random() })
);

// AUTH/WHOAMI — echoes the credential headers Apigee forwarded (or stripped).
// Test VerifyAPIKey, OAuthV2, JWT/JWS verification, BasicAuth, header stripping.
router.get('/auth/whoami', (req, res) => {
  res.json({
    success: true,
    service: 'diagnostics',
    authorization: req.headers['authorization'] || null,
    apiKey: req.headers['x-api-key'] || req.headers['apikey'] || null,
    // Apigee typically decodes JWT claims into headers like x-jwt-* / x-apigee-*.
    forwardedClaims: Object.fromEntries(
      Object.entries(req.headers).filter(([k]) => k.startsWith('x-jwt') || k.startsWith('x-apigee') || k.startsWith('x-oauth'))
    ),
  });
});

// SECURE/DATA — a dummy protected resource. Backend does NOT check auth (Apigee does);
// this just confirms the request got past the gateway.
router.get('/secure/data', (req, res) =>
  res.json({ success: true, service: 'diagnostics', message: 'You reached a protected resource', secret: 'level-7-clearance' })
);

module.exports = router;
