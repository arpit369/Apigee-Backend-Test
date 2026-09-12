# Apigee Enterprise API Backend (Mock)

Simple Node.js + Express backend to sit behind Apigee. No auth, no DB, no
rate limiting — Apigee owns all of that. This backend just returns mock JSON
and stamps a `serverId` so you can prove load balancing across two instances.

## Folder structure

```
apigee-backend/
├── server.js        # all routes + error handling (single file)
├── package.json     # deps + run scripts
├── .env.example     # sample PORT / SERVER_ID
└── README.md
```

## Install

```bash
cd apigee-backend
npm install
```

## Run two instances (two terminals)

Terminal 1 — Backend 1:

```bash
npm run start:backend1
```

Terminal 2 — Backend 2:

```bash
npm run start:backend2
```

Those scripts set `PORT` and `SERVER_ID` via `cross-env` (cross-platform).
Manual equivalent:

- Windows PowerShell: `$env:PORT=3001; $env:SERVER_ID="backend-1"; node server.js`
- macOS/Linux: `PORT=3001 SERVER_ID=backend-1 node server.js`

## Endpoints

| Method | Path                | Body                                   |
|--------|---------------------|----------------------------------------|
| GET    | /health             | —                                      |
| GET    | /customer/profile   | —                                      |
| POST   | /customer/orders    | `{product, quantity}`                  |
| GET    | /admin/users        | —                                      |
| POST   | /admin/users        | `{name, email, role}`                  |
| GET    | /partner/data       | —                                      |
| POST   | /payment/transfer   | `{fromAccount, toAccount, amount, currency}` |

## Test with cURL

```bash
# Health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Customer
curl http://localhost:3001/customer/profile
curl -X POST http://localhost:3001/customer/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Laptop","quantity":1}'

# Admin
curl http://localhost:3001/admin/users
curl -X POST http://localhost:3001/admin/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","role":"USER"}'

# Partner
curl http://localhost:3001/partner/data

# Payment
curl -X POST http://localhost:3001/payment/transfer \
  -H "Content-Type: application/json" \
  -d '{"fromAccount":"ACC001","toAccount":"ACC002","amount":5000,"currency":"INR"}'

# 404 (unknown route)
curl http://localhost:3001/does-not-exist

# 400 (invalid JSON)
curl -X POST http://localhost:3001/customer/orders \
  -H "Content-Type: application/json" -d '{bad}'
```

On Windows PowerShell, `curl` is an alias for `Invoke-WebRequest` with
different syntax. Either use `curl.exe ...` with the commands above, or
`Invoke-RestMethod`:

```powershell
Invoke-RestMethod http://localhost:3001/health
Invoke-RestMethod -Method Post http://localhost:3001/payment/transfer -ContentType "application/json" -Body '{"fromAccount":"ACC001","toAccount":"ACC002","amount":5000,"currency":"INR"}'
```

## Verify load balancing before Apigee

1. Start both instances (ports 3001 and 3002).
2. Hit each directly and confirm the `serverId` field:
   - `curl http://localhost:3001/customer/profile` → `"serverId":"backend-1"`
   - `curl http://localhost:3002/customer/profile` → `"serverId":"backend-2"`
3. In Apigee, register both as **Target Servers** and enable load balancing.
   When you call the Apigee proxy repeatedly, the `serverId` in the response
   should alternate between `backend-1` and `backend-2`.
