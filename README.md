# VoxBCI

Monorepo for the VoxBCI platform: a single TypeScript codebase that ships to Android and iOS via Expo.

## Structure

| Path        | Purpose                                              |
| ----------- | ---------------------------------------------------- |
| `frontend/` | Expo app (SDK 58, React Native 0.88, expo-router)    |
| `backend/`  | API / services                                       |
| `CAD/`      | Hardware design files                                |
| `Docs/`     | Specifications, research, meeting notes              |

## Prerequisites

- Node.js 22.13+ / 24.3+ / 26+ (developed on v26.13.0)
- npm 11+
- PowerShell execution policy allowing npm: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Frontend

```powershell
cd frontend
npm install          # only after a fresh clone
npx expo start       # Metro bundler + QR code for Expo Go
npx expo start --web # run in the browser
npx expo-doctor      # project health check
```

`npx expo` is the CLI. Do **not** install the global `expo-cli` package — it is deprecated.

## Building installables

Builds run in EAS cloud, so **no macOS required** for iOS.

```powershell
npm install -g eas-cli
eas login
cd frontend

# Android APK (shareable, sideloadable)
eas build -p android --profile preview

# iOS IPA (requires a paid Apple Developer account + device UDIDs)
eas build -p ios --profile preview

# Store releases (AAB for Play, IPA for App Store)
eas build -p android --profile production
eas build -p ios --profile production
```

Profile definitions live in `frontend/eas.json`. `preview` produces an APK for Android; `production` produces an AAB.

## Notes

- This repo lives inside OneDrive. `node_modules` and the Metro cache churn constantly during development; if sync errors or slow file access appear, move the repo outside OneDrive (e.g. `C:\Users\USER\Dev\VoxBCI`).
- Never commit `node_modules`, `.env` files, or signing keys — see `.gitignore`.
