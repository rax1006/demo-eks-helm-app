# Helm Charts

This directory contains Helm charts for deploying the sample application services to the EKS cluster.

## Available Charts

- **frontend**: Web frontend service with ALB ingress and autoscaling
- **backend**: API backend service with autoscaling

## Prerequisites

Before deploying these charts, ensure the following components are installed in your EKS cluster:

1. **AWS Load Balancer Controller** - For ALB provisioning (frontend only)
2. **Metrics Server** - For HPA functionality
3. **Cluster Autoscaler** - For node-level autoscaling
4. **ExternalSecrets Operator** (optional) - For secrets management

### Verify Prerequisites

```bash
# Check AWS Load Balancer Controller
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check Metrics Server
kubectl get deployment -n kube-system metrics-server

# Check Cluster Autoscaler
kubectl get deployment -n kube-system cluster-autoscaler

# Verify metrics are available
kubectl top nodes
kubectl top pods
```

## Quick Start

### 1. Update Configuration

Update the image repository and other AWS-specific values in each chart's `values.yaml`:

**Frontend (`frontend/values.yaml`):**
```yaml
image:
  repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/frontend
  tag: "v1.0.0"

ingress:
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc123
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
```

**Backend (`backend/values.yaml`):**
```yaml
image:
  repository: 123456789012.dkr.ecr.us-east-1.amazonaws.com/backend
  tag: "v1.0.0"
```

### 2. Deploy Backend Service

```bash
# Install backend
helm install backend ./backend

# Verify deployment
kubectl get pods -l app.kubernetes.io/name=backend
kubectl get svc backend
kubectl get hpa backend
```

### 3. Deploy Frontend Service

```bash
# Install frontend
helm install frontend ./frontend

# Verify deployment
kubectl get pods -l app.kubernetes.io/name=frontend
kubectl get svc frontend
kubectl get ingress frontend
kubectl get hpa frontend
```

### 4. Get ALB URL

```bash
# Get the ALB DNS name
kubectl get ingress frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Deployment Patterns

### Development Environment

For development, you might want to disable autoscaling and use fewer replicas:

```bash
helm install backend ./backend \
  --set autoscaling.enabled=false \
  --set replicaCount=1 \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=128Mi

helm install frontend ./frontend \
  --set autoscaling.enabled=false \
  --set replicaCount=1 \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=128Mi
```

### Production Environment

For production, use a custom values file with production settings:

**production-values.yaml:**
```yaml
image:
  tag: "v1.0.0"

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

```bash
helm install backend ./backend -f production-values.yaml
helm install frontend ./frontend -f production-values.yaml
```

### Staging Environment

```bash
helm install backend ./backend \
  --namespace staging \
  --create-namespace \
  --set image.tag=staging-latest

helm install frontend ./frontend \
  --namespace staging \
  --set image.tag=staging-latest \
  --set ingress.hosts[0].host=staging.example.com
```

## Upgrading

### Rolling Update with New Image

```bash
# Upgrade backend
helm upgrade backend ./backend \
  --set image.tag=v1.1.0 \
  --wait

# Upgrade frontend
helm upgrade frontend ./frontend \
  --set image.tag=v1.1.0 \
  --wait
```

### Rollback

```bash
# View release history
helm history backend

# Rollback to previous version
helm rollback backend

# Rollback to specific revision
helm rollback backend 2
```

## CI/CD Integration

### Using with CodeBuild

Example buildspec.yml for deployment stage:

```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - aws eks update-kubeconfig --name $EKS_CLUSTER_NAME --region $AWS_REGION
      - helm version
  build:
    commands:
      - |
        helm upgrade --install backend ./helm-charts/backend \
          --set image.tag=$IMAGE_TAG \
          --wait \
          --timeout 5m
      - |
        helm upgrade --install frontend ./helm-charts/frontend \
          --set image.tag=$IMAGE_TAG \
          --wait \
          --timeout 5m
  post_build:
    commands:
      - kubectl get pods
      - kubectl get hpa
      - kubectl get ingress
```

### Using with ArgoCD

Create Application manifests for GitOps:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: backend
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/your-repo
    targetRevision: main
    path: helm-charts/backend
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Monitoring

### Check Application Health

```bash
# Check pod status
kubectl get pods -l app=backend
kubectl get pods -l app=frontend

# Check HPA metrics
kubectl get hpa
kubectl describe hpa backend
kubectl describe hpa frontend

# Check resource usage
kubectl top pods -l app=backend
kubectl top pods -l app=frontend
```

### View Logs

```bash
# Backend logs
kubectl logs -l app=backend --tail=100 -f

# Frontend logs
kubectl logs -l app=frontend --tail=100 -f
```

### Access Grafana Dashboards

If kube-prometheus-stack is installed:

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

# Access at http://localhost:3000
# Default credentials: admin / prom-operator
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check image pull
kubectl get events --sort-by='.lastTimestamp'
```

### HPA Not Scaling

```bash
# Check metrics server
kubectl get apiservice v1beta1.metrics.k8s.io -o yaml

# Check HPA status
kubectl describe hpa backend

# Manually check metrics
kubectl top pods
```

### Ingress Not Working

```bash
# Check ingress status
kubectl describe ingress frontend

# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ALB in AWS Console
aws elbv2 describe-load-balancers
```

### Service Connectivity Issues

```bash
# Test backend from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://backend:8080/health

# Check service endpoints
kubectl get endpoints backend
kubectl get endpoints frontend
```

## Cleanup

### Uninstall Charts

```bash
# Uninstall frontend (this will also delete the ALB)
helm uninstall frontend

# Uninstall backend
helm uninstall backend

# Verify cleanup
kubectl get all
kubectl get ingress
```

### Delete Namespace

```bash
# If deployed in a specific namespace
kubectl delete namespace staging
```

## Best Practices

1. **Always use specific image tags** - Avoid using `latest` in production
2. **Set resource requests and limits** - Ensures proper scheduling and prevents resource exhaustion
3. **Enable autoscaling** - Allows applications to handle variable load
4. **Use health checks** - Ensures Kubernetes can detect and recover from failures
5. **Implement pod anti-affinity** - Spreads pods across nodes for high availability
6. **Use secrets for sensitive data** - Never hardcode credentials in values files
7. **Enable monitoring** - Add Prometheus annotations for metrics collection
8. **Test in staging first** - Always validate changes in a non-production environment

## Additional Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
