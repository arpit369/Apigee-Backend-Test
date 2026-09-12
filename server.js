// Mock enterprise backend for an Apigee API Gateway project.
// Apigee handles auth, quota, rate limiting, threat protection, CORS, etc.
// This backend stays dumb on purpose: mock data, no DB, no security logic.

const express = require('express');

const app = express();

const PORT = process.env.PORT || 3001;
const SERVER_ID = process.env.SERVER_ID || 'backend-1';

// Parse JSON bodies. Invalid JSON is caught by the error handler at the bottom.
app.use(express.json());

// Stamp serverId onto every JSON response so you can see which backend
// (behind Apigee load balancing) actually handled the request.
app.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      body.serverId = SERVER_ID;
    }
    return sendJson(body);
  };
  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hello user 👋 — enterprise API backend is running',
    service: 'enterprise-api-backend',
    endpoints: ['/health', '/customer/profile', '/customer/orders', '/admin/users', '/partner/data', '/payment/transfer'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'enterprise-api-backend' });
});

// ---------------------------------------------------------------------------
// Customer APIs
// ---------------------------------------------------------------------------
app.get('/customer/profile', (req, res) => {
  res.json({
    success: true,
    service: 'customer',
    message: 'Customer profile retrieved successfully',
    customer: { id: 'CUST001', name: 'Rohan', email: 'rohan@example.com' },
  });
});

app.post('/customer/orders', (req, res) => {
  const { product, quantity } = req.body || {};
  res.status(201).json({
    success: true,
    service: 'customer',
    message: 'Order created successfully',
    order: {
      id: 'ORD' + Date.now(),
      product: product || 'Unknown',
      quantity: quantity || 1,
      status: 'CONFIRMED',
    },
  });
});

// ---------------------------------------------------------------------------
// Admin APIs
// ---------------------------------------------------------------------------
app.get('/admin/users', (req, res) => {
  res.json({
    success: true,
    service: 'admin',
    message: 'Users retrieved successfully',
    users: [
      { id: 'USR001', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' },
      { id: 'USR002', name: 'Bob', email: 'bob@example.com', role: 'USER' },
    ],
  });
});

app.post('/admin/users', (req, res) => {
  const { name, email, role } = req.body || {};
  res.status(201).json({
    success: true,
    service: 'admin',
    message: 'User created successfully',
    user: {
      id: 'USR' + Date.now(),
      name: name || 'Unknown',
      email: email || 'unknown@example.com',
      role: role || 'USER',
    },
  });
});

// ---------------------------------------------------------------------------
// Partner API
// ---------------------------------------------------------------------------
app.get('/partner/data', (req, res) => {
  res.json({
    success: true,
    service: 'partner',
    message: 'Partner data retrieved successfully',
    data: [
      { id: 1, name: 'Partner A' },
      { id: 2, name: 'Partner B' },
    ],
  });
});

// ---------------------------------------------------------------------------
// Payment API
// ---------------------------------------------------------------------------
app.post('/payment/transfer', (req, res) => {
  const { amount, currency } = req.body || {};
  res.json({
    success: true,
    service: 'payment',
    message: 'Payment transfer processed successfully',
    transaction: {
      id: 'TXN' + Math.floor(100000 + Math.random() * 900000),
      amount: amount || 0,
      currency: currency || 'INR',
      status: 'SUCCESS',
    },
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

// Unknown routes -> 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
  });
});

// Invalid JSON body (thrown by express.json()) and other errors -> 400
app.use((err, req, res, next) => {
  res.status(400).json({
    success: false,
    error: { code: 'BAD_REQUEST', message: 'Invalid request data' },
  });
});

app.listen(PORT, () => {
  console.log(`[${SERVER_ID}] listening on http://localhost:${PORT}`);
});
