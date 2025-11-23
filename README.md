# Just Talk

A React Native mobile app for Android that allows you to record audio and automatically send it to your backend via webhook.

## Features

- 🎤 One-tap audio recording
- ⏱️ Real-time recording timer
- 🔊 Audio visualization during recording
- 👥 Multi-speaker mode toggle
- 🔄 Automatic webhook integration (n8n compatible)
- 📱 Beautiful dark-themed UI

## Prerequisites

Before you begin, make sure you have the following installed on your computer:

1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **npm** or **yarn** (comes with Node.js)
3. **Expo CLI** - We'll install this in the setup steps
4. **Android Studio** (for Android development) - [Download here](https://developer.android.com/studio)
5. **Expo Go app** on your Android phone - [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Setup Instructions

### Step 1: Install Dependencies

Open your terminal/command prompt and navigate to the project directory:

```bash
cd just-talk
```

Install the project dependencies:

```bash
npm install
```

If you don't have Expo CLI installed globally, install it:

```bash
npm install -g expo-cli
```

### Step 2: Configure Webhook URL

1. Open the `config.js` file in the project root
2. Replace `'YOUR_WEBHOOK_URL_HERE'` with your actual n8n webhook URL

```javascript
export const CONFIG = {
  WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/your-webhook-id',
};
```

### Step 3: Set Up Android Development Environment

#### Option A: Using Expo Go (Easiest - Recommended for beginners)

1. Install **Expo Go** app on your Android phone from the Play Store
2. Make sure your phone and computer are on the same Wi-Fi network
3. Start the development server:

```bash
npm start
```

4. Scan the QR code that appears with the Expo Go app (Android) or use the Expo Go app to connect

#### Option B: Building a Standalone APK (For production)

If you want to create a standalone app file (APK) that you can install directly:

1. Install **EAS CLI** (Expo Application Services):

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure the build:

```bash
eas build:configure
```

4. Build for Android:

```bash
eas build --platform android --profile preview
```
This will create an APK file that you can download and install on your Android device.

```bash
eas build --platform android 
```

This will create an file to publish in Google Play Store

### Step 4: Run the App

#### Development Mode (with Expo Go)

```bash
npm start
```

Then:
- Press `a` to open on Android device/emulator
- Or scan the QR code with Expo Go app

#### Direct Android Launch

```bash
npm run android
```

This will attempt to open the app on a connected Android device or emulator.

## How to Use the App

1. **Start Recording**: Tap the large circular button in the center to start recording. The button will turn orange/red when recording is active.

2. **Monitor Recording**: 
   - Watch the timer at the top to see how long you've been recording
   - The audio visualization bars will animate during recording
   - A green indicator appears in the top-right when recording

3. **Multi-Speaker Mode**: Toggle the "Multi-speaker" switch if you want to enable multi-speaker detection (this setting is sent to your webhook)

4. **Stop Recording**: Tap the record button again (now showing as orange/red) to stop recording

5. **Automatic Upload**: Once you stop recording, the app will automatically:
   - Save the audio file
   - Send it to your configured webhook URL
   - Show a success message when complete

## Project Structure

```
just-talk/
├── App.js              # Main app component with recording logic
├── config.js           # Configuration file (webhook URL)
├── package.json        # Dependencies and scripts
├── app.json           # Expo configuration
├── babel.config.js    # Babel configuration
└── README.md          # This file
```

## Troubleshooting

### "Permission Denied" Error

- Make sure you've granted microphone permissions when prompted
- On Android, you can manually enable permissions in Settings > Apps > Just Talk > Permissions

### "Failed to send recording" Error

- Check that your webhook URL in `config.js` is correct
- Verify your n8n workflow is active and the webhook is accessible
- Check your internet connection

### "EMFILE: too many open files" Error (macOS)

This error occurs when Metro bundler tries to watch too many files. Install watchman to fix it:

```bash
brew install watchman
```

After installing watchman, restart the development server. Watchman is a more efficient file watching service that Metro will automatically use.

### App Won't Start

- Make sure all dependencies are installed: `npm install`
- Clear cache and restart: `npm start -- --clear`
- Check that Node.js version is 16 or higher: `node --version`

### Can't Connect to Expo Go

- Ensure your phone and computer are on the same Wi-Fi network
- Try using the "Tunnel" connection type in Expo (press `s` in the terminal and select "Tunnel")
- Check that your firewall isn't blocking the connection

### Build Errors

- Make sure you have Android Studio installed and configured
- Set up Android SDK and environment variables if building standalone APK
- Check Expo documentation for latest build requirements

## Customization

### Changing Colors

Edit the `styles` object in `App.js` to customize colors:
- Background: `backgroundColor: '#1a1a2e'`
- Primary accent: `backgroundColor: '#6c5ce7'` (purple)
- Record button: `backgroundColor: '#ff7675'` (red/orange)

### Audio Quality

The app uses `HIGH_QUALITY` recording preset. You can modify this in `App.js`:

```javascript
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
```

Available presets: `LOW_QUALITY`, `MEDIUM_QUALITY`, `HIGH_QUALITY`

## Webhook Payload

When a recording is sent to your webhook, it includes:

- `audio`: The audio file (multipart/form-data)
- `duration`: Recording duration in seconds (string)
- `multiSpeaker`: Multi-speaker mode status (string: "true" or "false")

Your n8n workflow should be configured to receive multipart/form-data.

## Development Tips

- Use `console.log()` statements and check the Expo developer tools for debugging
- The app uses Expo's Audio API which works on both iOS and Android
- For production, consider adding error handling and retry logic for webhook calls
- You can test the webhook integration using tools like Postman or curl

## Next Steps

- Add audio playback functionality
- Implement recording history/list
- Add file management (delete old recordings)
- Enhance error handling and user feedback
- Add settings screen for webhook configuration

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Audio API](https://docs.expo.dev/versions/latest/sdk/audio/)
- [n8n Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## License

This project is open source and available for personal use.

## Support

If you encounter any issues:
1. Check the Troubleshooting section above
2. Review Expo and React Native documentation
3. Check that all dependencies are up to date: `npm update`

---

**Note**: This app requires microphone permissions to function. Make sure to grant these permissions when prompted on first use.
