# Backpocket Mobile

A React Native mobile app for Backpocket, built with Expo SDK 54.

## Features

- 📱 **Native look & feel** with Backpocket's brand theme
- 🔐 **Clerk authentication** with SecureStore token persistence
- 🔗 **Share to Backpocket** - Share URLs from any app to save automatically
- 📚 **Full save management** - Create, view, favorite, archive, delete saves
- 📁 **Collections & Tags** - Organize your saves
- 🌗 **Light/Dark mode** - Follows system preference
- 🎨 **NativeWind** - Tailwind CSS styling for React Native

## Tech Stack

- **Framework**: Expo SDK 54 + Expo Router
- **Auth**: Clerk Expo + SecureStore
- **API**: tRPC (HTTP fetch with Bearer tokens)
- **State**: TanStack Query (React Query)
- **Styling**: NativeWind (Tailwind CSS)
- **Icons**: Lucide React Native
- **Fonts**: DM Sans + Fraunces (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for quick testing) or EAS Build (for share extension)

### Setup

1. Install dependencies:

```bash
bun install
```

2. Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

3. Add your Clerk publishable key and API URL to `.env.local`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_API_URL=https://backpocket.dev
```

### Development

Start the development server:

```bash
bun start
```

Run on iOS:

```bash
bun ios
```

Run on Android:

```bash
bun android
```

## Share Extension (iOS)

The iOS share extension requires a **development build** (not Expo Go).

### Building for Development

```bash
npx eas build --profile development --platform ios
```

### How it Works

1. User shares a URL from any app (Safari, Twitter, etc.)
2. iOS share sheet shows "Backpocket" option
3. Minimal share extension UI extracts the URL
4. Opens the host app via `backpocket://share?url=...`
5. Host app auto-saves the URL via API
6. User sees success confirmation

## Android Share Intent

Share intent works via the `expo-share-intent` plugin. When a user shares text/URL to Backpocket:

1. Android sends the intent to the app
2. App opens to `/share` route with the shared data
3. Auto-save flow proceeds same as iOS

## Project Structure

```
backpocket-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (sign-in, sign-up)
│   ├── (tabs)/            # Main tab navigator
│   │   ├── index.tsx      # Dashboard
│   │   ├── saves.tsx      # Saves list
│   │   ├── collections.tsx
│   │   ├── tags.tsx
│   │   └── settings.tsx
│   ├── save/              # Save detail screens
│   │   ├── [id].tsx       # Save detail
│   │   └── new.tsx        # Add new save
│   ├── share.tsx          # Share handler route
│   └── _layout.tsx        # Root layout
├── components/
│   ├── ui/                # UI primitives
│   └── providers.tsx      # App providers
├── lib/
│   ├── api/               # tRPC client & hooks
│   ├── auth/              # Clerk token cache
│   ├── theme/             # Theme tokens & provider
│   └── constants.ts       # App configuration
├── constants/
│   └── theme.ts           # Colors, fonts, shadows
├── hooks/                 # Custom hooks
├── ShareExtension.tsx     # iOS share extension UI
├── index.js               # Host app entry
└── index.share.js         # Share extension entry
```

## Configuration Files

- `app.json` - Expo config with plugins
- `eas.json` - EAS Build configuration
- `metro.config.js` - Metro bundler + NativeWind + Share Extension
- `tailwind.config.js` - NativeWind/Tailwind theme
- `babel.config.js` - Babel + NativeWind preset

## API Integration

The app communicates with the Next.js web app's tRPC API:

- Base URL: `EXPO_PUBLIC_API_URL` (default: `https://backpocket.dev`)
- Auth: Clerk JWT tokens via `Authorization: Bearer <token>` header
- Endpoints: Same as web (`space.createSave`, `space.listSaves`, etc.)

## Building for Production

### iOS

```bash
npx eas build --profile production --platform ios
npx eas submit --platform ios
```

### Android

```bash
npx eas build --profile production --platform android
npx eas submit --platform android
```

## Environment Variables

| Variable                            | Description           | Required                                |
| ----------------------------------- | --------------------- | --------------------------------------- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes                                     |
| `EXPO_PUBLIC_API_URL`               | Backend API URL       | Yes (default: `https://backpocket.dev`) |

## License

Private - Backpocket
