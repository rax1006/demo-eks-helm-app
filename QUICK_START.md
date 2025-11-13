# Quick Start - EKS Demo Application

## What's in this repository?

This is the **APPLICATION REPOSITORY** containing:
- ✅ Frontend source code (React + Vite)
- ✅ Backend source code (Node.js + Express)
- ✅ Dockerfiles for both applications
- ✅ GitHub Actions CI/CD workflows
- ✅ Helm values files (environment-specific configurations)

## Prerequisites

1. **Infrastructure deployed** (from EKS-DEMO-INFRA repository)
2. **GitHub Secrets configured:**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
3. **Update workflow files** with your:
   - AWS region
   - EKS cluster name
   - Infrastructure repository URL

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
# Access: http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:3000
```

## Deploy to EKS

### Option 1: Automatic (Recommended)
```bash
git add .
git commit -m "Deploy application"
git push origin main
# GitHub Actions will automatically build and deploy
```

### Option 2: Manual
```bash
# Build and push backend
cd backend
docker build -t <ECR_URL>/backend:latest .
docker push <ECR_URL>/backend:latest

# Deploy with Helm
helm upgrade --install backend ../EKS-DEMO-INFRA/helm-charts/backend \
  -f helm-values/backend-prod.yaml \
  --set image.tag=latest
```

## Configuration Steps

### 1. Update GitHub Workflows

Edit `.github/workflows/backend-deploy.yml`:
```yaml
env:
  AWS_REGION: us-east-1  # Your region
  EKS_CLUSTER_NAME: my-eks-cluster  # Your cluster
  HELM_CHART_REPO: https://github.com/YOUR-ORG/EKS-DEMO-INFRA.git
```

Edit `.github/workflows/frontend-deploy.yml` similarly.

### 2. Update Helm Values

Edit `helm-values/backend-prod.yaml`:
```yaml
image:
  repository: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/backend
```

Edit `helm-values/frontend-prod.yaml`:
```yaml
image:
  repository: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend
ingress:
  hosts:
    - host: your-domain.com  # Your actual domain
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...  # Your cert
```

### 3. Push and Deploy
```bash
git add .
git commit -m "Configure for my environment"
git push origin main
```

## Verify Deployment

```bash
# Check pods
kubectl get pods -n default

# Check services
kubectl get svc -n default

# Check ingress
kubectl get ingress -n default

# Get application URL
kubectl get ingress frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n default
kubectl logs <pod-name> -n default
```

### Image pull errors
- Verify ECR repositories exist
- Check node IAM role has ECR permissions

### ALB not created
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
kubectl describe ingress frontend -n default
```

## Next Steps

1. ✅ Deploy infrastructure (EKS-DEMO-INFRA)
2. ✅ Configure this repository
3. ✅ Push to trigger deployment
4. ✅ Access your application via ALB URL
5. ✅ Set up custom domain (optional)

## Repository Structure

```
EKS-DEMO-APP/
├── .github/workflows/     # CI/CD pipelines
│   ├── backend-deploy.yml
│   └── frontend-deploy.yml
├── backend/               # Node.js API
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/              # React app
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── helm-values/           # Environment configs
│   ├── backend-dev.yaml
│   ├── backend-prod.yaml
│   ├── frontend-dev.yaml
│   └── frontend-prod.yaml
└── README.md
```

## Support

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

For infrastructure setup, see the EKS-DEMO-INFRA repository.
