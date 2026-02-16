#!/bin/bash

# Test script for welcome email system
# Usage: ./test-welcome-email.sh your-email@example.com

EMAIL=${1:-"test@example.com"}
API_URL=${2:-"http://localhost:3000"}

echo "🧪 Testing Welcome Email System"
echo "================================"
echo ""
echo "Email: $EMAIL"
echo "API URL: $API_URL"
echo ""

# Test 1: Send test welcome email
echo "📧 Test 1: Sending test welcome email..."
RESPONSE=$(curl -s -X POST "$API_URL/api/emails/send-test-welcome" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Response: $RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q "success.*true"; then
  echo "✅ Test email sent successfully!"
  echo ""
  echo "📬 Check your inbox at: $EMAIL"
  echo "   (Don't forget to check spam folder)"
else
  echo "❌ Failed to send test email"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo "================================"
echo "✅ Test Complete!"
echo ""
echo "Next steps:"
echo "1. Check your email inbox"
echo "2. Click 'Start Your First Quiz' button"
echo "3. Verify it goes to /tutor?action=start-quiz"
echo ""
echo "To test full signup flow:"
echo "1. Go to $API_URL/signup"
echo "2. Create a new account"
echo "3. Check if welcome email arrives"
