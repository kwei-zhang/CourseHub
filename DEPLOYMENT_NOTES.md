# Deployment Notes

## Current deployment baseline

This branch includes:
- Kubernetes manifests under `k8s/`
- PostgreSQL deployment, service, and PVC
- Ingress
- HPA for `auth` and `frontend`
- Backup CronJob for PostgreSQL dumps to DigitalOcean Spaces
- Basic GitHub Actions CI workflow

## Required runtime secrets

Fill `k8s/secrets-template.yaml` with real values before deployment:

- `DATABASE_URL`
- `FILE_SERVER_DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SPACES_BUCKET`
- `SPACES_KEY`
- `SPACES_SECRET`
- `SPACES_REGION`
- `SPACES_ENDPOINT`

Suggested local cluster DB values:

- `DATABASE_URL=postgresql://ece1779:ece1779@postgres:5432/ece1779`
- `FILE_SERVER_DATABASE_URL=postgresql://ece1779:ece1779@postgres:5432/ece1779?schema=files`

## Before applying manifests

Check or replace:
- `REPLACE_WITH_FRONTEND_IMAGE`
- `REPLACE_WITH_AUTH_IMAGE`
- `REPLACE_WITH_USER_SERVER_IMAGE`
- `REPLACE_WITH_FILE_SERVER_IMAGE`
- `REPLACE_WITH_SYSTEM_SERVER_IMAGE`
- `REPLACE_WITH_DOMAIN`

## Suggested apply order

1. Namespace
2. Secret
3. PostgreSQL PVC / Deployment / Service
4. Backend Deployments and Services
5. Frontend Deployment and Service
6. Ingress
7. HPA
8. Backup CronJob

## Files added or updated in this branch

- `k8s/namespace.yaml`
- `k8s/secrets-template.yaml`
- `k8s/postgres-pvc.yaml`
- `k8s/postgres-deployment.yaml`
- `k8s/postgres-service.yaml`
- `k8s/*-deployment.yaml`
- `k8s/*-service.yaml`
- `k8s/ingress.yaml`
- `k8s/auth-hpa.yaml`
- `k8s/frontend-hpa.yaml`
- `k8s/db-backup-cronjob.yaml`
- `.github/workflows/ci.yml`

## Known follow-up items

- Replace placeholder image names with real registry image tags
- Replace placeholder ingress domain
- Verify DigitalOcean Kubernetes ingress / load balancer behavior
- Validate auth public URL in deployed environment
- Optionally extend GitHub Actions into full CD

## Auth public URL

If deployment uses a single ingress host with path routing:
- frontend is served from `https://<domain>`
- auth is reached through `https://<domain>/api/...`

In that case:
- `BETTER_AUTH_URL` should be set to `https://<domain>`
- `NEXT_PUBLIC_AUTH_URL` should also be set to `https://<domain>`

Do not use `:4000` in the public URL if auth is exposed through ingress path routing.
