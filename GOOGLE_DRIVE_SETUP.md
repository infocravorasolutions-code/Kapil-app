# Google Drive Integration Setup Guide

## Overview
This guide will help you set up Google Drive integration for your React Native app to enable PDF cloud storage and sharing.

## Prerequisites
- Google Cloud Console account
- React Native development environment
- Android/iOS development setup

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

## Step 2: Configure OAuth 2.0

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen first if prompted
4. Create credentials for:
   - **Android**: Application type = Android
   - **iOS**: Application type = iOS
   - **Web**: Application type = Web application (for server-side)

## Step 3: Android Configuration

### 3.1 Get SHA-1 Fingerprint
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore (if you have one)
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

### 3.2 Configure OAuth Client
- Application type: Android
- Package name: `com.kapil_soni_apk` (from your AndroidManifest.xml)
- SHA-1 certificate fingerprint: [Your SHA-1 from step 3.1]

### 3.3 Update Android Configuration
Add to `android/app/src/main/res/values/strings.xml`:
```xml
<string name="google_drive_client_id">YOUR_ANDROID_CLIENT_ID</string>
```

## Step 4: iOS Configuration

### 4.1 Configure OAuth Client
- Application type: iOS
- Bundle ID: `com.kapil_soni_apk` (from your Info.plist)

### 4.2 Update iOS Configuration
Add to `ios/KAPIL_SONI_APK/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>google</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## Step 5: Update Code Configuration

### 5.1 Update Google Drive Service
In `src/utils/googleDriveService.ts`, replace:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});
```

### 5.2 Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Step 6: Install Dependencies

```bash
npm install @react-native-google-signin/google-signin
npm install react-native-pdf

# For iOS
cd ios && pod install
```

## Step 7: Platform-Specific Setup

### Android Setup
1. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

2. Update `android/settings.gradle`:
```gradle
include ':react-native-google-signin'
project(':react-native-google-signin').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-google-signin/google-signin/android')
```

### iOS Setup
1. Add to `ios/Podfile`:
```ruby
pod 'GoogleSignIn', '~> 7.0'
```

2. Run `cd ios && pod install`

## Step 8: Test Integration

1. Build and run your app
2. Try to upload a PDF to Google Drive
3. Check Google Drive for uploaded files
4. Test sharing functionality

## Troubleshooting

### Common Issues:

1. **"Sign in failed"**
   - Check SHA-1 fingerprint matches
   - Verify package name is correct
   - Ensure Google Drive API is enabled

2. **"Upload failed"**
   - Check internet connection
   - Verify OAuth scopes include Drive access
   - Check file permissions

3. **iOS build errors**
   - Run `cd ios && pod install`
   - Clean build folder
   - Check Info.plist configuration

### Debug Steps:
1. Check console logs for error messages
2. Verify Google Cloud Console configuration
3. Test with different file sizes
4. Check network connectivity

## Security Notes

- Never commit OAuth client IDs to public repositories
- Use environment variables for sensitive data
- Implement proper error handling
- Consider rate limiting for API calls

## API Limits

- Google Drive API has usage quotas
- Free tier: 1 billion requests per day
- File size limit: 5TB per file
- Rate limits apply

## Support

For issues with this integration:
1. Check Google Drive API documentation
2. Review React Native Google Sign-In docs
3. Check GitHub issues for the libraries used
4. Contact support with specific error messages

## Example Usage

```typescript
// Initialize Google Drive
await googleDriveService.initialize();

// Sign in
const signedIn = await googleDriveService.signIn();

// Upload file
const result = await googleDriveService.uploadFile(
  filePath, 
  fileName, 
  folderId
);

// Share file
await googleDriveService.shareFile(fileId, 'reader');
```

This setup will enable your app to:
- Upload PDFs to Google Drive
- Share PDFs with public links
- Sync files across devices
- Access files from anywhere
- Backup important documents
