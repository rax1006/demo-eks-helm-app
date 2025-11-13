# Frontend Application

React 18 application with Vite, deployed on EKS with Nginx.

## Local Development

```bash
npm install
npm run dev
```

Access at http://localhost:3000

## Build for Production

```bash
npm run build
npm run preview
```

## Docker

```bash
docker build -t frontend:local .
docker run -p 3000:3000 frontend:local
```

## Environment Variables

Set during build time in `vite.config.js`:
- `VITE_API_URL` - Backend API URL (default: http://localhost:8080)

## Features

- React 18 with hooks
- Vite for fast development
- Axios for API calls
- Responsive design
- Health check endpoint
- Nginx reverse proxy for API

## Endpoints

- `/` - Main application
- `/health` - Health check (returns 200)
- `/api/*` - Proxied to backend service

## Architecture

```
Browser → Nginx (Port 3000) → React App
                ↓
          Backend API (Port 8080)
```
