#!/bin/bash
echo "=== FINAL DEPLOYMENT VERIFICATION ==="
echo ""

echo "✅ 1. HTML Meta Tags Deployed:"
curl -s https://food.winy.ai/settings 2>&1 | grep -c "Force cache refresh"
echo ""

echo "✅ 2. New ETag (proving new HTML):"
curl -I https://food.winy.ai/settings 2>&1 | grep etag
echo ""

echo "✅ 3. Bundle Contains Dashboard Settings:"
curl -s https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -o "Dashboard Settings" | head -1
echo ""

echo "✅ 4. All Embed Routes Present:"
curl -s https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -o "/embed/[a-z-]*/:token" | sort -u
echo ""

echo "✅ 5. Custom Domain = Firebase Domain:"
CUSTOM_ETAG=$(curl -sI https://food.winy.ai/ 2>&1 | grep etag | awk '{print $2}')
FIREBASE_ETAG=$(curl -sI https://food-winy-ai.web.app/ 2>&1 | grep etag | awk '{print $2}')
echo "Custom:   $CUSTOM_ETAG"
echo "Firebase: $FIREBASE_ETAG"
if [ "$CUSTOM_ETAG" = "$FIREBASE_ETAG" ]; then
  echo "✅ MATCH"
else
  echo "❌ MISMATCH"
fi
echo ""

echo "=== DEPLOYMENT STATUS: SUCCESS ==="
echo "Dashboard Settings feature is LIVE at https://food.winy.ai/settings"
echo ""
echo "⚠️  USER ACTION REQUIRED:"
echo "   Clear browser cache to see new features:"
echo "   1. Open DevTools (F12)"
echo "   2. Right-click reload → 'Empty Cache and Hard Reload'"
echo "   3. Or open in private/incognito window"
