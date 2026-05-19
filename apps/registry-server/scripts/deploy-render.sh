#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Nitor SkillHub Registry Server — Render Deploy Guide
# ─────────────────────────────────────────────────────────────────────────────
# No CLI needed — Render deploys from GitHub/GitLab repos.
# ─────────────────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Deploy Nitor SkillHub Registry to Render (Free Tier)      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Step 1:${NC} Push this repo to GitHub"
echo "   git push origin main"
echo ""
echo -e "${GREEN}Step 2:${NC} Go to Render dashboard"
echo "   https://dashboard.render.com"
echo ""
echo -e "${GREEN}Step 3:${NC} Click "New +" > "Blueprint""
echo ""
echo -e "${GREEN}Step 4:${NC} Connect your GitHub repo"
echo "   Render finds render.yaml at the repo root and auto-configures." 
echo ""
echo -e "${GREEN}Step 5:${NC} Click "Apply" — Render builds & deploys"
echo "   First build takes ~5-10 min (Docker build with pnpm)."
echo ""
echo ""
echo -e "${BLUE}After deploy:${NC}"
echo "   Check the Render dashboard for your app's URL."
echo "   (Format: nitor-skillhub-registry-XXXX.onrender.com)"
echo ""
echo "   Test it:"
echo "   curl https://your-app.onrender.com/api/health"
echo ""
echo "   Use the CLI:"
echo "   nitor-skill search --registry https://your-app.onrender.com"
echo "   nitor-skill publish ./my-skill --registry https://your-app.onrender.com"
echo "   nitor-skill install <name> --registry https://your-app.onrender.com"
echo ""
echo -e "${YELLOW}⚠️  Free tier limitations:${NC}"
echo "   • Server sleeps after 15 min of inactivity"
 echo "   • Cold start takes ~2-3s on first request after idle"
echo "   • Data resets on restart/deploy (no persistent disk on free tier)"
echo "   • Upgrade to Starter ($7/mo) for persistent /data disk"
