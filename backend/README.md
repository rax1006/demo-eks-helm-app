# Backend API

Node.js Express API with Prometheus metrics and health checks.

## Local Development

```bash
npm install
npm run dev
```

Access at http://localhost:8080

## Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics
- `GET /api/status` - API status
- `GET /api/data` - Get data
- `POST /api/data` - Create data

## Docker

```bash
docker build -t backend:local .
docker run -p 8080:8080 backend:local
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Log level (debug/info/warn/error)
