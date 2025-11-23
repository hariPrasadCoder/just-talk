// Configuration file for Just Talk app
// Replace the webhook URL with your n8n webhook URL

// Set to 'prod' for production, 'test' for testing
const ENVIRONMENT = 'prod'; // Change to 'prod' when deploying to production

const WEBHOOK_URL_TEST = 'https://n8n.myrealproduct.com/webhook-test/just-talk'; // Replace with your test n8n webhook URL
const WEBHOOK_URL_PROD = 'https://n8n.myrealproduct.com/webhook/just-talk'; // Replace with your production n8n webhook URL

// Computed webhook URL based on environment
const WEBHOOK_URL = ENVIRONMENT === 'prod' ? WEBHOOK_URL_PROD : WEBHOOK_URL_TEST;

export const CONFIG = {
  ENVIRONMENT,
  WEBHOOK_URL_TEST,
  WEBHOOK_URL_PROD,
  WEBHOOK_URL,
};

