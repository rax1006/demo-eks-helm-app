# Complete Setup Guide

This guide walks you through setting up the complete application deployment pipeline.

## Overview

We use a **two-repository approach**:

1. **eks-platform-infrastructure** (Infrastructure repo)
   - Terraform for AWS resources
   - Helm charts (templates)
   - Platform configuration

2. **eks-application** (Application repo - THIS REPO)
   - Frontend & Backend source code
   - Dockerfiles
   - GitHub Actions CI/CD

## Step 1: Prerequisites

### Required Tools

Install the following on your local machine:

```bash
# AWS CLI
aws --version  # Should be 2.x

# kubectl
kubectl version --client

# Helm
helm version

# Terraform (for infrastructure repo)
terraform version

# Docker (for local testing)
docker --version

# Node.js (for local development)
node --version  # Should be 18.x or higher
```

### AWS Account Setup

1. **Create AWS Account** (if not already done)

2. **Create IAM User** for CI/CD:
   ```bash
   aws iam create-user --user-name github-actions-deployer
   ```

3. **Attach Policies**:
   ```bash
   # ECR permissions
   aws iam attach-user-policy \
     --user-name github-actions-deployer \
     --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
   
   # EKS permissions
   aws iam attach-user-policy \
     --user-name github-actions-deployer \
     --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
   ```

4. **Create Access Keys**:
   ```bash
   aws iam create-access-key --user-name github-actions-deployer
   ```
   
   Save the output:
   - `AccessKeyId`
   - `SecretAccessKey`

## Step 2: Deploy Infrastructure

### 2.1 Clone Infrastructure Repository

```bash
git clone https://github.com/YOUR-ORG/eks-platform-infrastructure.git
cd eks-platform-infrastructure
```

### 2.2 Configure Terraform

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Update these values:
```hcl
cluster_name = "my-eks-cluster"
region       = "us-east-1"
vpc_cidr     = "10.0.0.0/16"

# Your ACM certificate ARN
acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/xxx"

# Node configuration
node_instance_types = ["t3.large"]
node_desired_size   = 3
node_min_size       = 3
node_max_size       = 10
```

### 2.3 Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply (takes 15-20 minutes)
terraform apply
```

### 2.4 Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --name my-eks-cluster \
  --region us-east-1

# Verify access
kubectl get nodes
kubectl get pods -A
```

### 2.5 Verify Platform Components

```bash
# Check AWS Load Balancer Controller
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check Metrics Server
kubectl get deployment -n kube-system metrics-server

# Check Cluster Autoscaler
kubectl get deployment -n kube-system cluster-autoscaler
```

## Step 3: Create Application Repository

### 3.1 Create New GitHub Repository

1. Go to GitHub: https://github.com/new
2. Repository name: `eks-application`
3. Visibility: Private (recommended)
4. Click "Create repository"

### 3.2 Copy Application Code

```bash
# Clone the new repository
git clone https://github.com/YOUR-ORG/eks-application.git
cd eks-application

# Copy all files from application-code/ directory
# (Copy the contents of the application-code folder you created)

# Initialize git
git add .
git commit -m "Initial commit: Frontend and Backend application"
git push origin main
```

## Step 4: Configure GitHub Secrets

### 4.1 Add AWS Credentials

Go to your repository: `https://github.com/YOUR-ORG/eks-application/settings/secrets/actions`

Add these secrets:

1. **AWS_ACCESS_KEY_ID**
   - Value: Your AWS access key from Step 1

2. **AWS_SECRET_ACCESS_KEY**
   - Value: Your AWS secret key from Step 1

3. **GITHUB_TOKEN**
   - This is automatically provided by GitHub
   - No need to add manually

### 4.2 Update Workflow Files

Edit `.github/workflows/backend-deploy.yml`:

```yaml
env:
  AWS_REGION: us-east-1  # Your region
  ECR_REPOSITORY: backend
  EKS_CLUSTER_NAME: my-eks-cluster  # Your cluster name
  HELM_CHART_REPO: https://github.com/YOUR-ORG/eks-platform-infrastructure.git  # Your infra repo
```

Edit `.github/workflows/frontend-deploy.yml`:

```yaml
env:
  AWS_REGION: us-east-1  # Your region
  ECR_REPOSITORY: frontend
  EKS_CLUSTER_NAME: my-eks-cluster  # Your cluster name
  HELM_CHART_REPO: https://github.com/YOUR-ORG/eks-platform-infrastructure.git  # Your infra repo
```

Commit and push:
```bash
git add .github/workflows/
git commit -m "Configure CI/CD workflows"
git push origin main
```

## Step 5: Update Helm Values

### 5.1 Get ECR Repository URLs

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get ECR URLs
echo "Backend ECR: $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/backend"
echo "Frontend ECR: $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend"
```

### 5.2 Update Helm Values Files

Edit `helm-values/backend-dev.yaml`:
```yaml
image:
  repository: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/backend
```

Edit `helm-values/frontend-dev.yaml`:
```yaml
image:
  repository: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend

ingress:
  hosts:
    - host: dev.myapp.example.com  # Your domain
```

Edit `helm-values/frontend-prod.yaml`:
```yaml
image:
  repository: YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/frontend

ingress:
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/YOUR-CERT-ID
  hosts:
    - host: myapp.example.com  # Your domain
```

Commit and push:
```bash
git add helm-values/
git commit -m "Update Helm values with ECR URLs"
git push origin main
```

## Step 6: First Deployment

### 6.1 Trigger Deployment

Push to main branch triggers automatic deployment:

```bash
# Make a small change to trigger deployment
echo "# EKS Application" > README.md
git add README.md
git commit -m "Trigger initial deployment"
git push origin main
```

### 6.2 Monitor Deployment

1. Go to GitHub Actions: `https://github.com/YOUR-ORG/eks-application/actions`
2. Watch the workflow runs
3. Both backend and frontend should deploy successfully

### 6.3 Verify Deployment

```bash
# Check deployments
kubectl get deployments -n default

# Check pods
kubectl get pods -n default

# Check services
kubectl get svc -n default

# Check ingress
kubectl get ingress -n default

# Get ALB URL
kubectl get ingress frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Step 7: Access Application

### 7.1 Get Application URL

```bash
# Get ALB hostname
ALB_URL=$(kubectl get ingress frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Application URL: http://$ALB_URL"
```

### 7.2 Test Application

```bash
# Test backend health
curl http://$ALB_URL/api/health

# Test backend API
curl http://$ALB_URL/api/status

# Open in browser
open http://$ALB_URL  # macOS
# or
start http://$ALB_URL  # Windows
```

## Step 8: Configure DNS (Optional)

### 8.1 Create Route53 Record

```bash
# Get ALB hostname
ALB_URL=$(kubectl get ingress frontend -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create Route53 record (replace with your hosted zone ID)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "myapp.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_URL'"}]
      }
    }]
  }'
```

### 8.2 Update Ingress

Edit `helm-values/frontend-prod.yaml`:
```yaml
ingress:
  hosts:
    - host: myapp.example.com  # Your actual domain
```

Redeploy:
```bash
git add helm-values/frontend-prod.yaml
git commit -m "Update domain name"
git push origin main
```

## Step 9: Enable HTTPS (Production)

### 9.1 Request ACM Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name myapp.example.com \
  --validation-method DNS \
  --region us-east-1
```

### 9.2 Validate Certificate

Follow AWS Console instructions to add DNS validation records.

### 9.3 Update Ingress

Edit `helm-values/frontend-prod.yaml`:
```yaml
ingress:
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/YOUR-NEW-CERT-ID
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
```

## Step 10: Development Workflow

### 10.1 Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### 10.2 Make Changes

```bash
# Edit code
nano backend/src/server.js

# Test locally
npm run dev

# Commit and push
git add backend/
git commit -m "Add new API endpoint"
git push origin main
```

### 10.3 Automatic Deployment

- Push to `main` → Triggers GitHub Actions
- GitHub Actions → Builds Docker image
- Pushes to ECR → Deploys to EKS via Helm
- Kubernetes → Rolling update with zero downtime

## Troubleshooting

### Issue: GitHub Actions fails with "unauthorized to perform: ecr:GetAuthorizationToken"

**Solution**: Check IAM permissions for the GitHub Actions user.

```bash
aws iam list-attached-user-policies --user-name github-actions-deployer
```

### Issue: Pods stuck in "ImagePullBackOff"

**Solution**: Verify ECR repositories exist and node IAM role has ECR permissions.

```bash
# Check ECR repositories
aws ecr describe-repositories --region us-east-1

# Check node IAM role
kubectl describe pod <pod-name> -n default
```

### Issue: ALB not created

**Solution**: Check AWS Load Balancer Controller logs.

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Issue: Cannot connect to backend from frontend

**Solution**: Verify service names and ports.

```bash
# Check backend service
kubectl get svc backend -n default

# Test from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://backend:8080/health
```

## Next Steps

1. **Set up monitoring**: Configure Prometheus alerts
2. **Enable logging**: Set up CloudWatch Logs or ELK stack
3. **Add tests**: Implement unit and integration tests
4. **Set up staging**: Create staging environment
5. **Configure backups**: Set up Velero for cluster backups
6. **Security scanning**: Enable Trivy or Snyk for image scanning

## Support

For issues or questions:
- Check GitHub Actions logs
- Review Kubernetes events: `kubectl get events -n default`
- Check application logs: `kubectl logs -f deployment/backend -n default`
- Contact DevOps team

## Summary

You now have:
- ✅ EKS cluster with all platform components
- ✅ Frontend (React) and Backend (Node.js) applications
- ✅ Automated CI/CD with GitHub Actions
- ✅ Container images in ECR
- ✅ Applications deployed via Helm
- ✅ Auto-scaling configured
- ✅ Load balancer with health checks
- ✅ Monitoring with Prometheus

**Deployment Flow**:
```
Developer Push → GitHub Actions → Build Docker Image → Push to ECR → Deploy via Helm → EKS Cluster
```
