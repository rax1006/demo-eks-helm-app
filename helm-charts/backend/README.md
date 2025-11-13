# Backend Helm Chart

This Helm chart deploys the backend service to Kubernetes with support for autoscaling and security best practices.

## Prerequisites

- Kubernetes 1.26+
- Helm 3.x
- ECR repository for backend images
- Metrics Server installed for HPA functionality

## Configuration

### Required Values

Before deploying, update the following values in `values.yaml`:

```yaml
image:
  repository: <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/backend
  tag: "latest"
```

### Key Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas (ignored if autoscaling enabled) | `3` |
| `image.repository` | Container image repository | `<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/backend` |
| `image.tag` | Container image tag | `latest` |
| `service.port` | Service port | `8080` |
| `service.targetPort` | Container port | `8080` |
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `3` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `70` |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization | `80` |
| `resources.requests.cpu` | CPU request | `500m` |
| `resources.requests.memory` | Memory request | `512Mi` |
| `resources.limits.cpu` | CPU limit | `1000m` |
| `resources.limits.memory` | Memory limit | `1Gi` |

## Installation

### Install with default values

```bash
helm install backend ./helm-charts/backend
```

### Install with custom values

```bash
helm install backend ./helm-charts/backend \
  --set image.tag=v1.0.0
```

### Install with values file

```bash
helm install backend ./helm-charts/backend -f custom-values.yaml
```

## Upgrade

```bash
helm upgrade backend ./helm-charts/backend \
  --set image.tag=v1.1.0
```

## Uninstall

```bash
helm uninstall backend
```

## Features

### Autoscaling

The chart includes HorizontalPodAutoscaler (HPA) configuration that scales pods based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min replicas: 3
- Max replicas: 10

### Service

The chart creates a ClusterIP service exposing port 8080, making the backend accessible to other services within the cluster (e.g., frontend).

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
  - name: DATABASE_URL
    value: "postgresql://db:5432/mydb"
  - name: LOG_LEVEL
    value: "info"
  - name: PORT
    value: "8080"
```

### Secrets

Reference secrets using `envFrom`:

```yaml
envFrom:
  - secretRef:
      name: backend-secrets
```

### Using ExternalSecrets

To sync secrets from AWS Secrets Manager:

```yaml
serviceAccount:
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<ACCOUNT_ID>:role/BackendSecretsRole
```

Then create an ExternalSecret resource:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: backend-secrets
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: backend-secrets
  data:
  - secretKey: DATABASE_URL
    remoteRef:
      key: prod/backend/database
      property: url
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

## Integration with Frontend

The frontend service can connect to the backend using the service name:

```yaml
# In frontend values.yaml
env:
  - name: API_URL
    value: "http://backend:8080"
```

## Troubleshooting

### Check pod status

```bash
kubectl get pods -l app.kubernetes.io/name=backend
```

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=backend --tail=100
```

### Check HPA status

```bash
kubectl get hpa
kubectl describe hpa backend
```

### Test service connectivity

```bash
# From within the cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://backend:8080/health
```

### Check service endpoints

```bash
kubectl get endpoints backend
```

## Performance Tuning

### Resource Allocation

The default resource allocation is:
- Requests: 500m CPU, 512Mi memory
- Limits: 1000m CPU, 1Gi memory

Adjust based on your application's needs:

```yaml
resources:
  requests:
    cpu: 1000m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi
```

### Autoscaling Thresholds

Adjust HPA thresholds based on your traffic patterns:

```yaml
autoscaling:
  targetCPUUtilizationPercentage: 60  # Scale up earlier
  targetMemoryUtilizationPercentage: 75
```

## Monitoring

The backend service should expose Prometheus metrics for monitoring. Add annotations to enable scraping:

```yaml
podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```
