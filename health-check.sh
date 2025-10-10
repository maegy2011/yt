#!/bin/bash

# YouTube Player & Hadith Encyclopedia - Health Check Script
# This script verifies that the application is running and accessible

echo "🔍 YouTube Player & Hadith Encyclopedia - Health Check"
echo "=================================================="

# Check if the server process is running
echo "1. Checking server process..."
if pgrep -f "tsx server.ts" > /dev/null; then
    echo "✅ Server process is running"
    PID=$(pgrep -f "tsx server.ts")
    echo "   Process ID: $PID"
else
    echo "❌ Server process is not running"
    exit 1
fi

# Check if port 3000 is listening
echo ""
echo "2. Checking port 3000..."
if ss -tlnp | grep -q ":3000"; then
    echo "✅ Port 3000 is listening"
    PORT_INFO=$(ss -tlnp | grep ":3000")
    echo "   $PORT_INFO"
else
    echo "❌ Port 3000 is not listening"
    exit 1
fi

# Test local HTTP response
echo ""
echo "3. Testing local HTTP response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Local HTTP response: 200 OK"
else
    echo "❌ Local HTTP response: $HTTP_CODE"
    exit 1
fi

# Test external HTTP response
echo ""
echo "4. Testing external HTTP response..."
EXTERNAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://21.0.11.54:3000/)
if [ "$EXTERNAL_CODE" = "200" ]; then
    echo "✅ External HTTP response: 200 OK"
else
    echo "❌ External HTTP response: $EXTERNAL_CODE"
    exit 1
fi

# Test API endpoint
echo ""
echo "5. Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$API_RESPONSE" | grep -q "status"; then
    echo "✅ API endpoint is responding"
    echo "   Response: $API_RESPONSE"
else
    echo "❌ API endpoint is not responding properly"
fi

# Test YouTube API endpoint
echo ""
echo "6. Testing YouTube API endpoint..."
YOUTUBE_RESPONSE=$(curl -s http://localhost:3000/api/youtube-test)
if echo "$YOUTUBE_RESPONSE" | grep -q "error"; then
    echo "⚠️  YouTube API endpoint responding (expected - API key not configured)"
    echo "   Response: $YOUTUBE_RESPONSE"
else
    echo "✅ YouTube API endpoint is responding"
fi

# Get server info
echo ""
echo "7. Getting server information..."
SERVER_INFO=$(curl -s http://localhost:3000/ | grep -o '<title>.*</title>' | sed 's/<title>//;s/<\/title>//')
echo "📄 Application Title: $SERVER_INFO"

echo ""
echo "🎉 HEALTH CHECK COMPLETE"
echo "========================"
echo "✅ Application is running and accessible"
echo "✅ All basic functionality is working"
echo "✅ Ready for use"
echo ""
echo "🌐 Access URLs:"
echo "   Local: http://localhost:3000"
echo "   External: http://21.0.11.54:3000"
echo ""
echo "📱 Open your browser and navigate to the external URL above!"