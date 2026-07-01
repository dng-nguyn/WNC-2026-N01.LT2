# Operational Runbook — Coffee Shop POS

> **Stack:** AWS ECS Fargate + RDS MySQL + Cloudflare
> **Last updated:** 2026-07-01

---

## Health Checks

| Check | Command / URL | Expected Result |
|-------|---------------|-----------------|
| Backend API | `GET /health` | `Hello World!` |
| ECS target group | Auto (30s interval) | Healthy |
| Logs | `/ecs/coffee-shop-pos` log group | No errors |

```bash
# Quick health check (replace with your domain)
curl -s https://<YOUR_DOMAIN>/health

# Check ECS target health via ALB
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# Tail CloudWatch logs
aws logs tail /ecs/coffee-shop-pos --follow
```

---

## Common Issues

### Container Keeps Restarting (OOM)

**Symptom:** Task restarts repeatedly; ECS events show task stopped.

```bash
# Check logs for exit code 137 (killed by OOM)
aws logs filter-log-events \
  --log-group-name /ecs/coffee-shop-pos \
  --filter-pattern "exit code 137"

# Check current task resources
aws ecs describe-task-definition \
  --task-definition coffee-shop-pos \
  --query "taskDefinition.{cpu:cpu,memory:memory}"
```

**Fix:**
1. Increase task memory in `task-definition.json` (current: **1 vCPU, 2GB RAM**).
2. Re-register the task definition and update the service:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs update-service \
  --cluster coffee-shop-pos \
  --service coffee-shop-pos \
  --task-definition coffee-shop-pos
```

---

### Database Connection Failed

**Symptom:** Backend logs show connection timeout or access denied to MySQL.

```bash
# 1. Verify RDS security group allows inbound 3306 from ECS security group
aws ec2 describe-security-groups \
  --filters "Name=group-id,Values=<RDS_SG_ID>" \
  --query "SecurityGroups[].IpPermissions[]"

# 2. Check Secrets Manager for correct credentials
aws secretsmanager get-secret-value \
  --secret-id coffee-shop-pos/credentials \
  --query "SecretString" --output text

# 3. Test connectivity from your machine
mysql -h <RDS_ENDPOINT> -u app_user -p
```

**Checklist:**
- [ ] RDS security group allows inbound port 3306 from the ECS security group.
- [ ] Secrets Manager contains valid `db-host` and `db-password`.
- [ ] RDS instance is **available** (not in `backing-up` or `rebooting` state).

---

### SSL Certificate Issues

**Symptom:** Browser shows "Your connection is not private" or HSTS warning.

- **Origin CA cert** expires in **2041** (issued by Cloudflare).
- **Cloudflare Universal SSL** auto-renews.

**Fix:**
1. If the browser reports a cert error, confirm the **Cloudflare proxy is ON** (orange cloud icon in DNS settings).
2. If an HSTS error persists: open an incognito window or clear HSTS cache for the domain.
3. If the cert was recently re-deployed, allow up to **5 minutes** for propagation.

---

### Deploy Failed

**Symptom:** GitHub Actions workflow fails or ECS service does not update.

```bash
# 1. Check GitHub Actions logs
gh run list --repo <OWNER>/coffee-shop-pos
gh run view <RUN_ID> --repo <OWNER>/coffee-shop-pos

# 2. Verify AWS credentials in GitHub repo secrets
gh secret list --repo <OWNER>/coffee-shop-pos

# 3. Verify ECR repository exists
aws ecr describe-repositories --repository-names coffee-shop-pos

# 4. Check ECS service events for errors
aws ecs describe-services \
  --cluster coffee-shop-pos \
  --services coffee-shop-pos \
  --query "services[].events[:5]"
```

**Common causes:**
- Expired or missing AWS credentials in GitHub secrets.
- ECR image tag not found (check the tag pushed matches what the task def expects).
- Insufficient IAM permissions for the deployment role.

---

### High Latency

**Symptom:** Slow page loads; users report delays when placing orders.

```bash
# 1. Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# 2. Check RDS CPU and memory in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=coffee-shop-db \
  --start-time $(date -u -d '1 hour ago' +%FT%TZ) \
  --end-time $(date -u +%FT%TZ) \
  --period 300 --statistics Average

# 3. Check ECS task CPU/memory
aws ecs describe-services \
  --cluster coffee-shop-pos \
  --services coffee-shop-pos \
  --query "services[].deployments[].{running:runningCount,desired:desiredCount,cpu:taskDefinition}"

# 4. Check RDS connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=coffee-shop-db \
  --start-time $(date -u -d '1 hour ago' +%FT%TZ) \
  --end-time $(date -u +%FT%TZ) \
  --period 300 --statistics Average
```

**Actions:**
- If RDS CPU > 80%, consider upgrading the instance class.
- If connections are maxed out, check for connection pool leaks in the backend.
- If task CPU is high, scale out to more Fargate tasks.

---

## Scaling

**Current:** 1 Fargate task (desired-count: 1). Auto-scaling is **not configured** (manual only).

```bash
# Scale to N tasks
aws ecs update-service \
  --cluster coffee-shop-pos \
  --service coffee-shop-pos \
  --desired-count N

# Verify
aws ecs describe-services \
  --cluster coffee-shop-pos \
  --services coffee-shop-pos \
  --query "services[].{desired:desiredCount,running:runningCount}"
```

> **Tip:** For production, consider enabling Application Auto Scaling with a target tracking policy on CPU utilization.

---

## Teardown

Run these commands in order. This **permanently deletes** all resources.

```bash
# 1. Scale service to zero
aws ecs update-service \
  --cluster coffee-shop-pos \
  --service coffee-shop-pos \
  --desired-count 0

# 2. Delete ECS service
aws ecs delete-service \
  --cluster coffee-shop-pos \
  --service coffee-shop-pos \
  --force

# 3. Delete ECS cluster
aws ecs delete-cluster --cluster coffee-shop-pos

# 4. Delete RDS instance
aws rds delete-db-instance \
  --db-instance-identifier coffee-shop-db \
  --skip-final-snapshot

# 5. Delete ECR repository
aws ecr delete-repository \
  --repository-name coffee-shop-pos \
  --force
```

> **Warning:** Data in RDS will be lost unless a snapshot is taken before deletion. Remove `--skip-final-snapshot` and add `--final-snapshot-identifier` to preserve data.

---

## Cost Monitoring

| Period | Estimated Cost |
|--------|---------------|
| First 6 months (Free Tier) | ~$0 |
| After Free Tier | ~$60/month (ECS + RDS + ALB) |

**Setup billing alerts:**
1. Open [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets).
2. Create a **Cost budget** with a threshold (e.g., $50/month).
3. Add an SNS notification to receive email alerts.

---

## Quick Reference

| Resource | Value |
|----------|-------|
| Cluster | `coffee-shop-pos` |
| Service | `coffee-shop-pos` |
| Task Definition | `coffee-shop-pos` |
| RDS Instance | `coffee-shop-db` |
| ECR Repo | `coffee-shop-pos` |
| Log Group | `/ecs/coffee-shop-pos` |
| Domain | `<YOUR_DOMAIN>` |
| Health Endpoint | `GET /health` → `Hello World!` |
