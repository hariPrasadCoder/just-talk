# Quick Start Guide

Get your Just Talk app running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Webhook

Edit `config.js` and add your n8n webhook URL:

```javascript
export const CONFIG = {
  WEBHOOK_URL: 'https://your-n8n-webhook-url-here',
};
```

## Step 3: Install Expo Go on Your Phone

Download **Expo Go** from the Google Play Store on your Android phone.

## Step 4: Start the App

```bash
npm start
```

## Step 5: Connect Your Phone

1. Make sure your phone and computer are on the same Wi-Fi network
2. Open Expo Go app on your phone
3. Scan the QR code shown in your terminal
4. The app will load on your phone!

## That's It! 🎉

Tap the record button to start recording. When you stop, it will automatically send to your webhook.

## Troubleshooting

- **Can't connect?** Make sure both devices are on the same Wi-Fi
- **Permission error?** Grant microphone permission when prompted
- **Webhook not working?** Check your URL in `config.js`

For more details, see the full [README.md](README.md).

