#!/bin/bash

echo "🚀 Testing Lighthouse Parallel POC locally"
echo "=========================================="

# Check if Redis is running
echo "📊 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Starting with Docker..."
    docker-compose up -d redis
    sleep 3
fi

echo "✅ Redis is running"

# Start the API in background
echo "🔧 Starting API..."
npm run start:dev &
API_PID=$!

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3000/lighthouse/stats > /dev/null 2>&1; then
        echo "✅ API is ready!"
        break
    fi
    sleep 2
done

# Test single audit
echo ""
echo "📋 Test 1: Single audit"
RESPONSE=$(curl -s -X POST http://localhost:3000/lighthouse/audit \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}')

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "Created job: $JOB_ID"

# Test batch audit
echo ""
echo "📋 Test 2: Batch of 10 parallel audits"
BATCH_RESPONSE=$(curl -s -X POST http://localhost:3000/lighthouse/batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com",
      "https://www.google.com",
      "https://github.com",
      "https://stackoverflow.com",
      "https://www.npmjs.com",
      "https://nestjs.com",
      "https://en.wikipedia.org",
      "https://www.reddit.com",
      "https://twitter.com",
      "https://www.linkedin.com"
    ]
  }')

BATCH_ID=$(echo $BATCH_RESPONSE | jq -r '.batchId')
echo "Created batch: $BATCH_ID"

# Monitor progress
echo ""
echo "⏳ Monitoring batch progress..."
START_TIME=$(date +%s)

while true; do
    STATUS=$(curl -s http://localhost:3000/lighthouse/batch/$BATCH_ID)
    COMPLETED=$(echo $STATUS | jq -r '.completed')
    FAILED=$(echo $STATUS | jq -r '.failed')
    ACTIVE=$(echo $STATUS | jq -r '.active')
    TOTAL=$(echo $STATUS | jq -r '.total')

    echo "Progress: $COMPLETED completed, $ACTIVE active, $FAILED failed out of $TOTAL"

    if [ $((COMPLETED + FAILED)) -eq $TOTAL ]; then
        break
    fi

    sleep 5
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=========================================="
echo "✅ All audits completed!"
echo "⏱️  Total duration: ${DURATION}s"
echo ""
echo "📊 Queue stats:"
curl -s http://localhost:3000/lighthouse/stats | jq '.'

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $API_PID 2>/dev/null

echo "✅ Test complete!"