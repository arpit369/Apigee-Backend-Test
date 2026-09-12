// Business APIs — the "enterprise" surface Apigee fronts.
// Grouped so you can attach different Apigee products/policies per path:
//   /customer/*  /admin/*  /partner/*  /payment/*
const express = require('express');
const router = express.Router();

const ok = (res, service, message, extra, status = 200) =>
  res.status(status).json({ success: true, service, message, ...extra });

// --- Customer ---
router.get('/customer/profile', (req, res) =>
  ok(res, 'customer', 'Customer profile retrieved successfully', {
    customer: { id: 'CUST001', name: 'Rohan', email: 'rohan@example.com' },
  })
);

router.post('/customer/orders', (req, res) => {
  const { product, quantity } = req.body || {};
  ok(res, 'customer', 'Order created successfully', {
    order: { id: 'ORD' + Date.now(), product: product || 'Unknown', quantity: quantity || 1, status: 'CONFIRMED' },
  }, 201);
});

// --- Admin ---
router.get('/admin/users', (req, res) =>
  ok(res, 'admin', 'Users retrieved successfully', {
    users: [
      { id: 'USR001', name: 'Alice', email: 'alice@example.com', role: 'ADMIN' },
      { id: 'USR002', name: 'Bob', email: 'bob@example.com', role: 'USER' },
    ],
  })
);

router.post('/admin/users', (req, res) => {
  const { name, email, role } = req.body || {};
  ok(res, 'admin', 'User created successfully', {
    user: { id: 'USR' + Date.now(), name: name || 'Unknown', email: email || 'unknown@example.com', role: role || 'USER' },
  }, 201);
});

// --- Partner ---
router.get('/partner/data', (req, res) =>
  ok(res, 'partner', 'Partner data retrieved successfully', {
    data: [
      { id: 1, name: 'Partner A' },
      { id: 2, name: 'Partner B' },
    ],
  })
);

// --- Payment ---
router.post('/payment/transfer', (req, res) => {
  const { amount, currency } = req.body || {};
  ok(res, 'payment', 'Payment transfer processed successfully', {
    transaction: {
      id: 'TXN' + Math.floor(100000 + Math.random() * 900000),
      amount: amount || 0,
      currency: currency || 'INR',
      status: 'SUCCESS',
    },
  });
});

module.exports = router;
