# EKS Application - Frontend & Backend

This repository contains the application code for a full-stack application deployed on AWS EKS.

## Architecture

```
┌─────────────────┐
│   GitHub Repo   │
│  (Application)  │
└────────┬────────┘
         │ Push to main
         ▼
┌─────────────────┐
│ GitHub Actions  │
│   CI/CD Pipeline│
└────────┬────────┘
         │ Build & Push
         ▼
┌─────────────────┐
│   Amazon ECR    │
│ Container Images│
└────────┬────────┘
         │ Deploy via Helm
         ▼
┌─────────────────┐
│   Amazon EKS    │
│  ┌───────────┐  │
│  │ Frontend  │  │
│  │  (React)  │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Backend  │  │
│  │ (Node.js) │  │
│  └───────────┘  │
└─────────────────┘
```

## Repository Structure

```
eks-application/
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml    # Backend CI/CD pipeline
│       └── frontend-deploy.yml   # Frontend CI/CD pipeline
├── backend/
│   ├── src/
│   │   └── server.js            # Express API server
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # React main component
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf               # Nginx config for production
│   ├── Dockerfile
│   └── .dockerignore
├── helm-values/
│   ├── backend-dev.yaml         # Backend dev environment values
│   ├── backend-prod.yaml        # Backend prod environment values
│   ├── frontend-dev.yaml        # Frontend dev environment values
│   └── frontend-prod.yaml       # Frontend prod environment values
└── README.md
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Web Server**: Nginx (production)
- **Styling**: CSS
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express
- **Monitoring**: Prometheus metrics
- **Security**: Helmet, CORS

## Prerequisites

Before deploying this application, ensure you have:

1. **AWS Account** with:
   - EKS cluster running (from infrastructure repo)
   - ECR repositories created (frontend & backend)
   - AWS credentials configured

2. **GitHub Repository** with secrets configured:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `GITHUB_TOKEN` (for accessing Helm charts repo)

3. **Infrastructure Repository**:
   - Helm charts deployed at: `https://github.com/YOUR-ORG/eks-platform-infrastructure`

## Local Development

### Backend

```bash
cd backend

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build Docker image
docker build -t backend:local .

# Run Docker container
docker run -p 8080:8080 backend:local
```

Test endpoints:
- Health: http://localhost:8080/health
- API Status: http://localhost:8080/api/status
- API Data: http://localhost:8080/api/data
- Metrics: http://localhost:8080/metrics

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build Docker image
docker build -t frontend:local .

# Run Docker container
docker run -p 3000:3000 frontend:local
```

Access at: http://localhost:3000

## Deployment

### Automatic Deployment (Recommended)

Push to `main` branch triggers automatic deployment:

```bash
# Make changes to backend
git add backend/
git commit -m "Update backend API"
git push origin main
# → Triggers backend-deploy.yml workflow

# Make changes to frontend
git add frontend/
git commit -m "Update frontend UI"
git push origin main
# → Triggers frontend-deploy.yml workflow
```

### Manual Deployment

Trigger workflows manually from GitHub Actions UI:
1. Go to Actions tab
2. Select workflow (Backend or Frontend)
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## CI/CD Pipeline

### Backend Pipeline (`backend-deploy.yml`)

1. **Checkout Code**: Clone application repository
2. **Configure AWS**: Set up AWS credentials
3. **Login to ECR**: Authenticate with Amazon ECR
4. **Build Image**: Build Docker image from backend/
5. **Push to ECR**: Push image with commit SHA and latest tags
6. **Install Tools**: Install kubectl and Helm
7. **Update Kubeconfig**: Configure kubectl for EKS cluster
8. **Checkout Helm Charts**: Clone infrastructure repository
9. **Deploy with Helm**: Run `helm upgrade --install`
10. **Verify Deployment**: Check rollout status
11. **Smoke Tests**: Test health and API endpoints

### Frontend Pipeline (`frontend-deploy.yml`)

1. **Checkout Code**: Clone application repository
2. **Configure AWS**: Set up AWS credentials
3. **Login to ECR**: Authenticate with Amazon ECR
4. **Build Image**: Build Docker image from frontend/
5. **Push to ECR**: Push image with commit SHA and latest tags
6. **Install Tools**: Install kubectl and Helm
7. **Update Kubeconfig**: Configure kubectl for EKS cluster
8. **Checkout Helm Charts**: Clone infrastructure repository
9. **Deploy with Helm**: Run `helm upgrade --install`
10. **Verify Deployment**: Check rollout status and Ingress
11. **Get ALB URL**: Retrieve Application Load Balancer URL
12. **Smoke Tests**: Test health endpoint and main page

## Configuration

### Environment Variables

**Backend** (`backend/src/server.js`):
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)

**Frontend** (build-time):
- `VITE_API_URL`: Backend API URL

### Helm Values

Override values during deployment:

```bash
# Development
helm upgrade --install backend ./helm-charts/backend \
  -f helm-values/backend-dev.yaml \
  --set image.tag=abc123

# Production
helm upgrade --install backend ./helm-charts/backend \
  -f helm-values/backend-prod.yaml \
  --set image.tag=v1.0.0
```

## Monitoring

### Prometheus Metrics

Backend exposes Prometheus metrics at `/metrics`:
- HTTP request duration
- Node.js default metrics (memory, CPU, etc.)

### Health Checks

**Backend**:
- Health: `GET /health`
- Readiness: `GET /ready`

**Frontend**:
- Health: `GET /health`

### Logs

View application logs:

```bash
# Backend logs
kubectl logs -f deployment/backend -n default

# Frontend logs
kubectl logs -f deployment/frontend -n default

# Follow logs from all pods
kubectl logs -f -l app.kubernetes.io/name=backend -n default
```

## Troubleshooting

### Image Pull Errors

```bash
# Verify ECR repositories exist
aws ecr describe-repositories --region us-east-1

# Check node IAM role has ECR permissions
kubectl describe pod <pod-name> -n default
```

### Deployment Failures

```bash
# Check deployment status
kubectl get deployments -n default
kubectl describe deployment backend -n default

# Check pod events
kubectl get pods -n default
kubectl describe pod <pod-name> -n default

# Check logs
kubectl logs <pod-name> -n default
```

### ALB Not Provisioned

```bash
# Check Ingress status
kubectl describe ingress frontend -n default

# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IRSA configuration
kubectl describe sa aws-load-balancer-controller -n kube-system
```

### Backend Connection Issues

```bash
# Test backend from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://backend:8080/health

# Check service endpoints
kubectl get endpoints backend -n default

# Port-forward for local testing
kubectl port-forward svc/backend 8080:8080 -n default
```

## Security

- **Non-root containers**: Both images run as non-root users
- **Image scanning**: ECR scans images for vulnerabilities
- **Security headers**: Helmet (backend), Nginx headers (frontend)
- **HTTPS**: TLS termination at ALB (production)
- **CORS**: Configured in backend
- **Health checks**: Kubernetes liveness/readiness probes

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n default

# Scale frontend
kubectl scale deployment frontend --replicas=5 -n default
```

### Auto-scaling (HPA)

Configured in production Helm values:
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

## Rollback

```bash
# View deployment history
kubectl rollout history deployment/backend -n default

# Rollback to previous version
kubectl rollout undo deployment/backend -n default

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n default

# Using Helm
helm rollback backend -n default
```

## Cost Optimization

- Use Spot instances for non-production environments
- Enable cluster autoscaler to scale down unused nodes
- Set appropriate resource requests/limits
- Use HPA to scale pods based on actual load
- Clean up old ECR images with lifecycle policies

## Support

For issues or questions:
1. Check application logs
2. Review GitHub Actions workflow runs
3. Check EKS cluster status
4. Contact DevOps team

## License

[Your License Here]
