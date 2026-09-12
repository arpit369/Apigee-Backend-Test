const express = require('express');
const { SERVER_ID, BODY_LIMIT } = require('./config');
const meta = require('./middleware/meta');
const logger = require('./middleware/logger');
const { notFound, errorHandler } = require('./middleware/errors');
const business = require('./routes/business');
const diagnostics = require('./routes/diagnostics');

const app = express();

// Behind Apigee + Railway/nginx — trust proxy so req.ip reflects X-Forwarded-For.
app.set('trust proxy', true);
app.disable('x-powered-by');

// Accept JSON, form, and raw text/XML so the echo/threat endpoints can reflect anything.
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use(express.text({ type: ['text/*', 'application/xml'], limit: BODY_LIMIT }));

app.use(logger);
app.use(meta);

// Root — friendly landing + endpoint catalog.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hello user 👋 — enterprise API backend (Apigee policy test harness)',
    service: 'enterprise-api-backend',
    business: ['/customer/profile', '/customer/orders', '/admin/users', '/partner/data', '/payment/transfer'],
    diagnostics: ['/echo', '/headers', '/ip', '/status/:code', '/delay/:seconds', '/data/xml', '/data/large', '/validate', '/cache/time', '/auth/whoami', '/secure/data'],
    health: ['/health', '/ready'],
  });
});

// Liveness + readiness (target-server health checks).
app.get('/health', (req, res) => res.json({ status: 'UP', service: 'enterprise-api-backend' }));
app.get('/ready', (req, res) => res.json({ status: 'READY', service: 'enterprise-api-backend' }));

app.use(business);
app.use(diagnostics);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
