#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Nitor SkillHub Registry Server — Fly.io Deploy Script
# ─────────────────────────────────────────────────────────────────────────────
# Prerequisites:
#   1. Install flyctl: curl -fsSL https://fly.io/install.sh | sh
#   2. Login:         fly auth login
#   3. Run this script from the project root.
# ─────────────────────────────────────────────────────────────────────────────

APP_NAME="nitor-skillhub-registry"
REGION="ord"         # Chicago — good US-central latency

# Check for flyctl
command -v fly >/dev/null 2>&1 || {
  echo "❌ flyctl not found. Install: curl -fsSL https://fly.io/install.sh | sh"
  exit 1
}

# Find project root (git root or fallback to current dir if not in a git repo)
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
cd "$PROJECT_ROOT"

echo "🚀 Deploying Nitor SkillHub Registry to Fly.io..."
echo "   Project root: $PROJECT_ROOT"

# Step 1: Launch the app (first time only)
if ! fly apps list 2>/dev/null | grep -q "$APP_NAME"; then
  echo "📦 Creating Fly.io app: $APP_NAME"
  fly launch \
    --name "$APP_NAME" \
    --dockerfile "apps/registry-server/Dockerfile" \
    --region "$REGION" \
    --no-deploy \
    --org personal \
    --ha=false \
    --yes
fi

# Step 2: Create persistent volume (first time only)
if ! fly volumes list --app "$APP_NAME" 2>/dev/null | grep -q "nitor_registry_data"; then
  echo "💾 Creating persistent volume (1GB)..."
  fly volumes create nitor_registry_data \
    --app "$APP_NAME" \
    --region "$REGION" \
    --size 1
fi

# Step 3: Set environment secrets
fly secrets set \
  --app "$APP_NAME" \
  NODE_ENV=production \
  REGISTRY_DATA_DIR=/data

# Step 4: Deploy
echo "☁️  Deploying..."
fly deploy --app "$APP_NAME" --dockerfile "apps/registry-server/Dockerfile" \
  --strategy immediate

echo ""
echo "✅ Deployed!"
echo "   URL: https://$APP_NAME.fly.dev"
echo ""
echo "   Try it:"
echo "   curl https://$APP_NAME.fly.dev/api/health"
echo "   curl https://$APP_NAME.fly.dev/api/skills"
echo ""
echo "   Then use the CLI:"
echo "   nitor-skill search spring --registry https://$APP_NAME.fly.dev"
echo "   nitor-skill install <skill-name> --registry https://$APP_NAME.fly.dev"
