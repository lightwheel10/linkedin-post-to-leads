import crypto from 'crypto';

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

// Generate webhook ID (standardwebhooks format uses msg_<id>)
const webhookId = `msg_${Date.now()}`;

// Generate timestamp (Unix seconds)
const timestamp = Math.floor(Date.now() / 1000).toString();

// For standardwebhooks format:
// 1. Strip whsec_ prefix from secret
// 2. Base64 decode the remaining string to get the raw key
// 3. Sign: HMAC-SHA256(key, webhook_id.timestamp.payload) -> base64
const secretBase64 = WEBHOOK_SECRET.replace('whsec_', '');
const secretBytes = Buffer.from(secretBase64, 'base64');

const signedPayload = `${webhookId}.${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', secretBytes)
  .update(signedPayload)
  .digest('base64');

// Format signature with version prefix (like Dodo does)
const fullSignature = `v1,${signature}`;

console.log('Sending test webhook to:', WEBHOOK_URL);
console.log('Webhook ID:', webhookId);
console.log('Timestamp:', timestamp);
console.log('Signature:', fullSignature);
console.log('Secret (first 10 chars):', secretBase64.substring(0, 10) + '...');
console.log('Payload preview:', payload.substring(0, 100) + '...');

// Send the webhook
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'webhook-signature': fullSignature,
    'webhook-timestamp': timestamp,
    'webhook-id': webhookId,
  },
  body: payload,
});

console.log('\nResponse status:', response.status);
const responseText = await response.text();
console.log('Response body:', responseText);
