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

// Generate timestamp (Unix seconds)
const timestamp = Math.floor(Date.now() / 1000).toString();

// Sign the payload: HMAC-SHA256(secret, timestamp.payload) -> base64
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('base64');

// Format signature with version prefix (like Dodo does)
const fullSignature = `v1,${signature}`;

console.log('Sending test webhook to:', WEBHOOK_URL);
console.log('Timestamp:', timestamp);
console.log('Signature:', fullSignature);
console.log('Payload preview:', payload.substring(0, 100) + '...');

// Send the webhook
const response = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'webhook-signature': fullSignature,
    'webhook-timestamp': timestamp,
  },
  body: payload,
});

console.log('\nResponse status:', response.status);
const responseText = await response.text();
console.log('Response body:', responseText);
