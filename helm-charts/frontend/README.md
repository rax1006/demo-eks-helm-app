# Frontend Helm Chart

This Helm chart deploys the frontend service to Kubernetes with support for autoscaling, ingress, and security best practices.

## Prerequisites

- Kubernetes 1.26+
- Helm 3.x
- AWS Load Balancer Controller installed in the cluster
- ACM certificate created for TLS termination
- ECR repository for frontend images

## Configuration

### Required Values

Before deploying, update the following values in `values.yaml`:

```yaml
image:
  repository: <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/frontend
  tag: "latest"

ingress:
  annotations:
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:<AWS_REGION>:<AWS_ACCOUNT_ID>:certificate/<CERT_ID>
  hosts:
    - host: example.com
      paths:
        - path: /
          pathType: Prefix
```

### Key Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas (ignored if autoscaling enabled) | `3` |
| `image.repository` | Container image repository | `<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/frontend` |
| `image.tag` | Container image tag | `latest` |
| `service.port` | Service port | `80` |
| `service.targetPort` | Container port | `8080` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `3` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `70` |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization | `80` |
| `resources.requests.cpu` | CPU request | `250m` |
| `resources.requests.memory` | Memory request | `256Mi` |
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |

## Installation

### Install with default values

```bash
helm install frontend ./helm-charts/frontend
```

### Install with custom values

```bash
helm install frontend ./helm-charts/frontend \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=myapp.example.com
```

### Install with values file

```bash
helm install frontend ./helm-charts/frontend -f custom-values.yaml
```

## Upgrade

```bash
helm upgrade frontend ./helm-charts/frontend \
  --set image.tag=v1.1.0
```

## Uninstall

```bash
helm uninstall frontend
```

## Features

### Autoscaling

The chart includes HorizontalPodAutoscaler (HPA) configuration that scales pods based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min replicas: 3
- Max replicas: 10

### Ingress

The chart creates an ALB-based Ingress with:
- TLS termination using ACM certificate
- HTTP to HTTPS redirect
- Health checks on `/health` endpoint
- IP target type for VPC CNI compatibility

### Security

The chart implements security best practices:
- Non-root user (UID 1000)
- Read-only root filesystem
- Dropped all capabilities
- No privilege escalation
- Pod anti-affinity for high availability

### Health Checks

- Liveness probe: `/health` endpoint
- Readiness probe: `/ready` endpoint

## Customization

### Environment Variables

Add environment variables in `values.yaml`:

```yaml
env:
  - name: API_URL
    value: "http://backend:8080"
  - name: LOG_LEVEL
    value: "info"
```

### Secrets

Reference secrets using `envFrom`:

```yaml
envFrom:
  - secretRef:
      name: frontend-secrets
```

### Volumes

Add volumes for temporary storage:

```yaml
volumeMounts:
  - name: tmp
    mountPath: /tmp

volumes:
  - name: tmp
    emptyDir: {}
```

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=frontend
```

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=frontend --tail=100
```

### Check HPA status

```bash
kubectl get hpa
```

### Check ingress

```bash
kubectl get ingress
kubectl describe ingress frontend
```

### Verify ALB creation

```bash
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `k8s`)].LoadBalancerArn'
```
