# Enterprise API Backend — Apigee Policy Test Harness

Mock enterprise REST backend built to sit behind Apigee. It stays intentionally
dumb (mock data, no DB, no auth) — Apigee owns auth, quota, threat protection,
etc. On top of the business APIs it exposes an **httpbin-style diagnostic
harness** so every Apigee policy has a concrete endpoint to prove against.

## Structure

```
apigee-backend/
├── src/
│   ├── server.js              # bootstrap + listen
│   ├── app.js                 # express app, middleware, route mounts, errors
│   ├── config.js              # env (PORT, SERVER_ID) + caps
│   ├── middleware/
│   │   ├── meta.js            # stamps serverId + requestId + timestamp on every response
│   │   ├── logger.js          # one log line per request
│   │   └── errors.js          # 404 + 400/500 envelopes
│   └── routes/
│       ├── business.js        # customer / admin / partner / payment
│       └── diagnostics.js     # echo / status / delay / xml / cache / whoami ...
├── test/smoke.test.js         # node --test, no framework
├── Dockerfile, .dockerignore
├── ecosystem.config.js        # pm2: runs both instances
├── package.json, .env.example
└── README.md
```

## Run

```bash
npm install
npm run start:backend1   # PORT=3001 SERVER_ID=backend-1
npm run start:backend2   # PORT=3002 SERVER_ID=backend-2  (second terminal)
npm test                 # smoke tests
```

Every JSON response includes `serverId` + `meta.requestId` + `meta.timestamp`.

## Business endpoints

| Method | Path | Body |
|---|---|---|
| GET | `/customer/profile` | — |
| POST | `/customer/orders` | `{product, quantity}` |
| GET | `/admin/users` | — |
| POST | `/admin/users` | `{name, email, role}` |
| GET | `/partner/data` | — |
| POST | `/payment/transfer` | `{fromAccount, toAccount, amount, currency}` |

## Diagnostic endpoints → Apigee policy each one tests

| Endpoint | What it does | Apigee policy to test |
|---|---|---|
| `ALL /echo` | reflects method, headers, query, body, ip | AssignMessage, CORS, security headers, header inject/strip, all mediation |
| `GET /headers` | echoes received headers | AssignMessage / security-header policies |
| `GET /ip` | client IP (trust-proxy) | Access Control (IP allow/deny), X-Forwarded-For |
| `ALL /status/:code` | returns that HTTP status | FaultRules, RaiseFault, target error mapping, LB failover |
| `ALL /delay/:seconds` | delays response (cap 10s) | target Timeout, Spike Arrest, Concurrent Rate Limit |
| `GET /data/xml` | XML body | XMLToJSON / JSONToXML, XML threat protection |
| `GET /data/large?count=N` | big JSON array (cap 1000) | message-size threat protection, Response Cache limits |
| `POST /validate` | needs `{name,email}` else 400 | MessageValidation, ExtractVariables + RaiseFault |
| `GET /cache/time` | fresh timestamp+random each call | **Response Cache** (value freezes when cached) |
| `GET /auth/whoami` | echoes Authorization / API key / JWT claim headers | VerifyAPIKey, OAuthV2, JWT/JWS, BasicAuth, header stripping |
| `GET /secure/data` | dummy protected resource | proves request passed the gateway (auth policies) |
| `GET /health`, `/ready` | liveness / readiness | Target Server health checks, load balancing |

## How to test key policies

- **Quota / Spike Arrest**: hammer any endpoint; Apigee should 429 before the backend sees traffic.
- **Response Cache**: attach to `GET /cache/time`; `timestamp` should stop changing until TTL expires.
- **VerifyAPIKey / OAuth / JWT**: call `GET /auth/whoami` through Apigee; check what credential headers actually reached the backend (Apigee should strip/inject as configured).
- **FaultRules**: `GET /status/500` (or 503) and confirm your custom error response replaces the raw backend one.
- **Timeout / failover**: `GET /delay/8` against a proxy with a 5s timeout → Apigee should 504 / fail over.
- **Threat protection**: POST deeply-nested / huge JSON to `/echo`; JSONThreatProtection should reject before the backend.
- **Mediation**: `GET /data/xml` with a JSONToXML/XMLToJSON policy to convert in flight.
- **Load balancing**: two instances (3001/3002); repeated proxy calls should alternate `serverId`.

## cURL quickstart

```bash
curl http://localhost:3001/health
curl -X POST http://localhost:3001/validate -H "Content-Type: application/json" -d '{"name":"A"}'   # 400, missing email
curl http://localhost:3001/status/503                                                                  # 503
curl "http://localhost:3001/delay/2"                                                                   # ~2s
curl http://localhost:3001/data/xml
curl -H "Authorization: Bearer x" -H "X-Api-Key: k" http://localhost:3001/auth/whoami
curl http://localhost:3001/echo -X POST -H "Content-Type: application/json" -d '{"hi":1}'
```

## Deploy

- **Railway** (easiest, trusted HTTPS): deploy this repo as two services, set `SERVER_ID` per service, Generate Domain. See earlier setup notes.
- **Debian VPS + pm2**: `pm2 start ecosystem.config.js` runs both instances; nginx + cert for HTTPS.
- **Docker**: `docker build -t apigee-backend . && docker run -e PORT=3001 -e SERVER_ID=backend-1 -p 3001:3001 apigee-backend`

Point Apigee Target Servers at the two instances and load-balance across them.
