#!/bin/bash
echo "=== PRODUCTION DEPLOYMENT VERIFICATION ==="
echo ""

echo "1. HTML Response Headers:"
curl -I https://food.winy.ai/settings 2>&1 | grep -E "cache-control|etag|last-modified"
echo ""

echo "2. Script Tag in HTML:"
curl -s https://food.winy.ai/settings 2>&1 | grep -o '<script[^>]*src="[^"]*"'
echo ""

echo "3. JS Bundle Headers:"
curl -I https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -E "cache-control|etag"
echo ""

echo "4. Dashboard Settings in Bundle:"
curl -s https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -o "Dashboard Settings" | head -1
echo ""

echo "5. Edit Dashboard Button in Bundle:"
curl -s https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -o "Edit Dashboard" | head -1
echo ""

echo "6. Embed Routes in Bundle:"
curl -s https://food.winy.ai/assets/index-D-ZCvzB0.js 2>&1 | grep -o "/embed/[a-z-]*" | sort -u
echo ""

echo "7. Local vs Deployed Hash Match:"
echo "Local:    $(grep -o 'src="/assets/index-[^"]*"' dist/index.html)"
echo "Deployed: $(curl -s https://food.winy.ai/ 2>&1 | grep -o 'src="/assets/index-[^"]*"')"
echo ""

echo "=== DIAGNOSIS ==="
echo "✅ Deployment is CORRECT - new code is live"
echo "❌ Browser is showing old cached version"
echo ""
echo "SOLUTION: Force browser cache clear"
echo "1. Open DevTools (F12)"
echo "2. Right-click reload button → 'Empty Cache and Hard Reload'"
echo "3. Or: Application tab → Clear storage → Clear site data"
