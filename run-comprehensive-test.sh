#!/bin/bash

echo "Running Comprehensive API Test Suite"
echo "====================================="

# Export environment variable to disable rate limiting
export DISABLE_RATE_LIMIT=true

# Clear Redis cache if available
redis-cli FLUSHDB 2>/dev/null || echo "Redis not available, continuing..."

# Run the comprehensive test
npx tsx tests/api/comprehensive-endpoint-test.ts

# Capture the exit code
EXIT_CODE=$?

# Display final message
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed successfully!"
else
  echo "❌ Some tests failed. Please review the errors above."
fi

exit $EXIT_CODE