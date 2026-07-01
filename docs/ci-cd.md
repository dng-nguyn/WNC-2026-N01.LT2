# CI/CD Pipeline

Automated testing, building, and deployment for the Cafe POS system. All workflows run on GitHub Actions and target AWS ECS Fargate.

---

## Workflows

### CI (`ci.yml`)

Continuous integration. Runs on every push and pull request to validate code before merge.

**Triggers:**
- Push to `main`
- Pull request to `main`
- Push to `cafe-backend-expansion` and frontend branches

**Jobs:**

| Job | Steps | Runtime |
|-----|-------|---------|
| `backend-test` | `npm ci` → `npm run build` → `npm test` | Node 22, MySQL 8 service container |
| `frontend-test` | `cd frontend && npm ci && npm test` | Node 22 |
| `frontend-e2e` | Playwright end-to-end tests | Node 22 |

**Runner:** `ubuntu-latest`

All three jobs run independently (no dependency between them), so backend and frontend tests execute in parallel.

---

### CD (`cd.yml`)

Docker image build and push to GitHub Container Registry. Produces multi-platform images for both AMD64 and ARM64.

**Triggers:**
- Push to `main`
- Manual dispatch (`workflow_dispatch`)

**Jobs:**

| Job | Description |
|-----|-------------|
| `build-and-push` | Builds the Docker image and pushes to GHCR (`ghcr.io`) |

**Platforms:** `linux/amd64`, `linux/arm64`

**Tag strategy:**

| Condition | Tag |
|-----------|-----|
| Push to `main` | `latest` |
| Any push | Short SHA of the commit |
| Any push | Branch name |

**Guard:** `if: github.ref == 'refs/heads/main'`

---

### Deploy AWS (`deploy-aws.yml`)

Full deployment pipeline: build, push to ECR, and update the ECS service.

**Triggers:**
- Push to `main`
- Manual dispatch (`workflow_dispatch`)

**Jobs:**

| Job | Description |
|-----|-------------|
| `deploy` | Build Docker image → push to ECR → update ECS task definition → deploy to ECS |

**Actions used:**

| Action | Purpose |
|--------|---------|
| `aws-actions/configure-aws-credentials@v6` | Authenticate to AWS |
| `aws-actions/amazon-ecr-login@v2` | Log in to ECR |
| `aws-actions/amazon-ecs-render-task-definition@v1` | Render the ECS task definition with the new image |
| `aws-actions/amazon-ecs-deploy-task-definition@v2` | Deploy the updated task definition to ECS |

**Guard:** `if: github.ref == 'refs/heads/main'`

---

### Lighthouse CI (`lighthouse.yml`)

Performance and quality audits on every pull request and push to `main` or `frontend-dev`.

**Triggers:**
- Pull request to `main`
- Push to `main` or `frontend-dev`

**Configuration:**
- **Preset:** Desktop
- **Tested paths:** `/`, `/login`, `/register`

**Assertions:**

| Metric | Minimum |
|--------|---------|
| Performance | >= 0.7 |
| Accessibility | >= 0.9 |
| Best Practices | >= 0.8 |

**Reports** are uploaded as workflow artifacts for review.

---

### CodeQL (`codeql.yml`)

Automated security analysis using GitHub's CodeQL engine.

**Triggers:**
- Pull request to `main`
- Push to `main`

Runs on every PR and merge to `main` to catch security issues early in the development cycle.

---

## GitHub Secrets

Required secrets for CI/CD workflows:

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | ECR push and ECS deploy authentication |
| `AWS_SECRET_ACCESS_KEY` | Same — paired with the access key above |
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions. Used for GHCR push and CodeQL analysis |

No manual secret configuration is needed for `GITHUB_TOKEN`. The AWS credentials must be added in **Settings → Secrets and variables → Actions**.

---

## Adding a New Deploy Target

To add a new deployment destination (e.g., a staging environment or a different cloud provider):

1. **Create the workflow file** in `.github/workflows/` with a descriptive name (e.g., `deploy-staging.yml`).
2. **Add required secrets** in the repository settings under *Settings → Secrets and variables → Actions*.
3. **Guard the workflow** with `if: github.ref == 'refs/heads/main'` to prevent accidental deploys from feature branches:

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # ...
```

For `workflow_dispatch` triggers (manual deploys), add a separate guard or rely on the manual trigger as the gate itself.
