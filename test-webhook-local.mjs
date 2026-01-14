import { Webhook } from 'standardwebhooks';

const WEBHOOK_SECRET = 'whsec_3XyXDs0Us2kjUpy1J5V3+iU84Lg1+P0v';
const WEBHOOK_URL = 'https://guffles.com/api/webhooks/dodo';

// Create a test payload
const payload = JSON.stringify({
  event_type: 'payment.succeeded',
  event_id: 'evt_test_' + Date.now(),
  created_at: new Date().toISOString(),
  data: {
    customer_id: 'cust_test123',
    subscription_id: 'sub_test123',
    product_id: 'pdt_0NVPNbgto7VD4oAb5Pgo5',
    status: 'succeeded',
    amount: 7900,
    currency: 'USD'
  }
});

// Generate webhook ID
const webhookId = `msg_${Date.now()}`;

// Generate timestamp (Unix seconds)
const timestamp = Math.floor(Date.now() / 1000).toString();

// Use standardwebhooks to sign the payload
const wh = new Webhook(WEBHOOK_SECRET);
const signature = wh.sign(webhookId, new Date(parseInt(timestamp) * 1000), payload);

console.log('=== LOCAL VERIFICATION TEST ===');
console.log('Webhook ID:', webhookId);
console.log('Timestamp:', timestamp);
console.log('Signature:', signature);
console.log('Secret (first 20 chars):', WEBHOOK_SECRET.substring(0, 20) + '...');

// Verify locally first
const headers = {
  'webhook-id': webhookId,
  'webhook-timestamp': timestamp,
  'webhook-signature': signature,
};

try {
  wh.verify(payload, headers);
  console.log('\n✅ LOCAL VERIFICATION PASSED\n');
} catch (error) {
  console.log('\n❌ LOCAL VERIFICATION FAILED:', error.message, '\n');
}

// Now send to the server
console.log('=== SENDING TO SERVER ===');
console.log('URL:', WEBHOOK_URL);

const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'webhook-signature': signature,
    'webhook-timestamp': timestamp,
    'webhook-id': webhookId,
  },
  body: payload,
});

console.log('\nResponse status:', response.status);
const responseText = await response.text();
console.log('Response body:', responseText);

if (response.status === 200) {
  console.log('\n✅ SERVER VERIFICATION PASSED');
} else {
  console.log('\n❌ SERVER VERIFICATION FAILED');
}
