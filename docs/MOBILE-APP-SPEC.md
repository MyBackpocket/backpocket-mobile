# Backpocket Mobile App Specification

A comprehensive specification for building a React Native mobile application using Expo that mirrors the functionality of the backpocket web application for iOS and Android devices.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Setup](#project-setup)
4. [Authentication](#authentication)
5. [API Integration](#api-integration)
6. [Core Features](#core-features)
7. [Screen Specifications](#screen-specifications)
8. [Data Models & Types](#data-models--types)
9. [Native Integrations](#native-integrations)
10. [UI/UX Guidelines](#uiux-guidelines)
11. [State Management](#state-management)
12. [Offline Support](#offline-support)
13. [Push Notifications](#push-notifications)
14. [App Store Requirements](#app-store-requirements)

---

## Overview

### App Purpose

Backpocket Mobile is a companion app that allows users to:

1. **Save links** from any app via the native share sheet
2. **Browse and manage** their saved content library
3. **Read articles** in a clean, distraction-free reader mode
4. **Organize content** with tags and collections
5. **Configure settings** for their public space

### Design Philosophy

- **Privacy by default**: Everything starts private
- **No social features**: No followers, likes, comments, or feeds
- **Calm and focused**: Clean, minimal UI with no algorithmic distractions
- **Offline-first**: Core functionality works without network

### Base API URL

```
Production: https://backpocket.dev
```

---

## Tech Stack

| Technology                                                                     | Purpose                                      |
| ------------------------------------------------------------------------------ | -------------------------------------------- |
| [Expo](https://expo.dev/)                                                      | React Native framework with managed workflow |
| [Expo Router](https://docs.expo.dev/router/introduction/)                      | File-based routing for React Native          |
| [React Native](https://reactnative.dev/)                                       | Cross-platform mobile framework              |
| [TypeScript](https://www.typescriptlang.org/)                                  | Type safety                                  |
| [Clerk Expo](https://clerk.com/docs/references/expo/overview)                  | Authentication                               |
| [TanStack Query](https://tanstack.com/query)                                   | Server state management                      |
| [Zustand](https://zustand-demo.pmnd.rs/)                                       | Client state management                      |
| [NativeWind](https://www.nativewind.dev/)                                      | Tailwind CSS for React Native                |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations                                   |
| [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)     | Secure token storage                         |
| [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)             | Share sheet integration                      |

### Why Expo?

- **Managed workflow**: No need to touch native code for most features
- **OTA updates**: Push updates without app store review
- **EAS Build**: Cloud-based builds for iOS and Android
- **Expo Router**: File-based routing similar to Next.js
- **Rich SDK**: Camera, notifications, sharing, etc. out of the box

---

## Project Setup

### Prerequisites

```bash
# Install bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install Expo CLI globally
bun add -g expo-cli eas-cli
```

### Initialize Project

```bash
# Create new Expo project with TypeScript and Expo Router
bunx create-expo-app@latest backpocket-mobile --template tabs

cd backpocket-mobile
```

### Install Dependencies

```bash
# Core dependencies
bun add @clerk/clerk-expo
bun add @tanstack/react-query
bun add zustand
bun add nativewind tailwindcss
bun add expo-secure-store
bun add expo-linking
bun add expo-web-browser
bun add expo-haptics
bun add expo-sharing

# UI components
bun add react-native-reanimated
bun add react-native-gesture-handler
bun add @gorhom/bottom-sheet
bun add react-native-safe-area-context
bun add lucide-react-native

# Development dependencies
bun add -d @types/react @types/react-native
```

### Project Structure

```
backpocket-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab layout configuration
│   │   ├── index.tsx             # Dashboard/Home
│   │   ├── saves.tsx             # Saves list
│   │   ├── collections.tsx       # Collections
│   │   └── settings.tsx          # Settings
│   ├── save/
│   │   ├── [id].tsx              # Save detail view
│   │   ├── new.tsx               # Add new save
│   │   └── edit/[id].tsx         # Edit save
│   ├── reader/[id].tsx           # Reader mode view
│   ├── collection/[id].tsx       # Collection detail
│   ├── tag/[id].tsx              # Tag filter view
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404 screen
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   └── BottomSheet.tsx
│   ├── saves/
│   │   ├── SaveCard.tsx
│   │   ├── SaveListItem.tsx
│   │   └── SaveForm.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── TabBar.tsx
│   └── QuickAdd.tsx              # Share sheet quick add
├── lib/
│   ├── api/
│   │   ├── client.ts             # API client setup
│   │   ├── saves.ts              # Saves API hooks
│   │   ├── tags.ts               # Tags API hooks
│   │   ├── collections.ts        # Collections API hooks
│   │   └── settings.ts           # Settings API hooks
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useColorScheme.ts
│   │   └── useDebounce.ts
│   ├── store/
│   │   ├── auth.ts               # Auth state
│   │   ├── settings.ts           # App settings
│   │   └── offline.ts            # Offline queue
│   ├── types.ts                  # Type definitions
│   ├── constants.ts              # App constants
│   └── utils.ts                  # Utility functions
├── assets/
│   ├── fonts/
│   └── images/
├── share-extension/              # iOS Share Extension (native)
├── android/                      # Android native code (if ejected)
├── ios/                          # iOS native code (if ejected)
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tailwind.config.js
└── package.json
```

### Expo Configuration (app.json)

```json
{
  "expo": {
    "name": "Backpocket",
    "slug": "backpocket",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "backpocket",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3B5998"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "dev.backpocket.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Used to save images from articles"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#3B5998"
      },
      "package": "dev.backpocket.app",
      "versionCode": 1,
      "intentFilters": [
        {
          "action": "android.intent.action.SEND",
          "category": ["android.intent.category.DEFAULT"],
          "data": [{ "mimeType": "text/plain" }]
        }
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.0"
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "clerkPublishableKey": "pk_live_xxx",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## Authentication

### Clerk Expo Setup

Backpocket uses [Clerk](https://clerk.com) for authentication. The mobile app integrates using `@clerk/clerk-expo`.

#### Environment Variables

```bash
# .env.local
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_API_URL=https://backpocket.dev
```

#### Clerk Provider Setup

```typescript
// app/_layout.tsx
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/auth/token-cache";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <Stack />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
```

#### Token Cache (Secure Storage)

```typescript
// lib/auth/token-cache.ts
import * as SecureStore from "expo-secure-store";
import { TokenCache } from "@clerk/clerk-expo";

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      // Handle error
    }
  },
};
```

#### Auth Flow

```typescript
// app/(auth)/sign-in.tsx
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const onSignIn = async (email: string, password: string) => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err) {
      // Handle error
    }
  };

  // ... render sign in form
}
```

#### Protected Routes

```typescript
// app/(tabs)/_layout.tsx
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Tabs>{/* Tab screens */}</Tabs>;
}
```

#### Getting Auth Token for API Calls

```typescript
// lib/api/client.ts
import { useAuth } from "@clerk/clerk-expo";

export function useApiClient() {
  const { getToken } = useAuth();

  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/trpc/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result?.data;
  };

  return { apiCall };
}
```

---

## API Integration

### tRPC Endpoint Structure

All API calls use the tRPC protocol:

```
POST https://backpocket.dev/api/trpc/<router>.<procedure>
```

### Core Endpoints Reference

#### Saves

| Endpoint                | Method | Auth | Description             |
| ----------------------- | ------ | ---- | ----------------------- |
| `space.listSaves`       | POST   | ✅   | List saves with filters |
| `space.getSave`         | POST   | ✅   | Get single save by ID   |
| `space.createSave`      | POST   | ✅   | Create new save         |
| `space.updateSave`      | POST   | ✅   | Update save             |
| `space.toggleFavorite`  | POST   | ✅   | Toggle favorite status  |
| `space.toggleArchive`   | POST   | ✅   | Toggle archive status   |
| `space.deleteSave`      | POST   | ✅   | Delete single save      |
| `space.bulkDeleteSaves` | POST   | ✅   | Bulk delete saves       |

#### Tags

| Endpoint          | Method | Auth | Description    |
| ----------------- | ------ | ---- | -------------- |
| `space.listTags`  | POST   | ✅   | List all tags  |
| `space.createTag` | POST   | ✅   | Create new tag |
| `space.updateTag` | POST   | ✅   | Update tag     |
| `space.deleteTag` | POST   | ✅   | Delete tag     |

#### Collections

| Endpoint                 | Method | Auth | Description          |
| ------------------------ | ------ | ---- | -------------------- |
| `space.listCollections`  | POST   | ✅   | List all collections |
| `space.createCollection` | POST   | ✅   | Create collection    |
| `space.updateCollection` | POST   | ✅   | Update collection    |
| `space.deleteCollection` | POST   | ✅   | Delete collection    |

#### Settings

| Endpoint                      | Method | Auth | Description                |
| ----------------------------- | ------ | ---- | -------------------------- |
| `space.getMySpace`            | POST   | ✅   | Get user's space settings  |
| `space.updateSettings`        | POST   | ✅   | Update space settings      |
| `space.updateSlug`            | POST   | ✅   | Change subdomain slug      |
| `space.checkSlugAvailability` | POST   | ✅   | Check if slug is available |

#### Snapshots (Reader Mode)

| Endpoint                    | Method | Auth | Description               |
| --------------------------- | ------ | ---- | ------------------------- |
| `space.getSaveSnapshot`     | POST   | ✅   | Get reader-mode content   |
| `space.requestSaveSnapshot` | POST   | ✅   | Request snapshot creation |
| `space.getSnapshotQuota`    | POST   | ✅   | Check snapshot quota      |

#### Stats

| Endpoint                 | Method | Auth | Description                    |
| ------------------------ | ------ | ---- | ------------------------------ |
| `space.getStats`         | POST   | ✅   | Get save/tag/collection counts |
| `space.getDashboardData` | POST   | ✅   | Get dashboard summary          |

### API Hooks Implementation

```typescript
// lib/api/saves.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./client";

interface ListSavesInput {
  query?: string;
  visibility?: "private" | "public";
  isArchived?: boolean;
  isFavorite?: boolean;
  collectionId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

export function useListSaves(input: ListSavesInput = {}) {
  const { apiCall } = useApiClient();

  return useQuery({
    queryKey: ["saves", input],
    queryFn: () =>
      apiCall("space.listSaves", {
        method: "POST",
        body: JSON.stringify({ json: input }),
      }),
  });
}

export function useCreateSave() {
  const { apiCall } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSaveInput) =>
      apiCall("space.createSave", {
        method: "POST",
        body: JSON.stringify({ json: input }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saves"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useToggleFavorite() {
  const { apiCall } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saveId, value }: { saveId: string; value?: boolean }) =>
      apiCall("space.toggleFavorite", {
        method: "POST",
        body: JSON.stringify({ json: { saveId, value } }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}

export function useToggleArchive() {
  const { apiCall } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saveId, value }: { saveId: string; value?: boolean }) =>
      apiCall("space.toggleArchive", {
        method: "POST",
        body: JSON.stringify({ json: { saveId, value } }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saves"] });
    },
  });
}

export function useDeleteSave() {
  const { apiCall } = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (saveId: string) =>
      apiCall("space.deleteSave", {
        method: "POST",
        body: JSON.stringify({ json: { saveId } }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saves"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
```

---

## Core Features

### 1. Dashboard / Home

**Purpose**: Overview of user's library with quick access to recent saves and stats.

**Components**:

- Welcome message with user name
- Quick stats (total saves, favorites, public)
- Recent saves (last 5-10 items)
- Quick actions (add save, search)

### 2. Saves List

**Purpose**: Browse, search, and filter all saved content.

**Features**:

- Grid and list view toggle
- Search by title, description, URL
- Filter by:
  - Visibility (all, public, private)
  - Favorites
  - Archived
  - Collection
  - Tag
- Pull-to-refresh
- Infinite scroll pagination
- Swipe actions (favorite, archive, delete)
- Multi-select mode for bulk operations

### 3. Save Detail

**Purpose**: View and edit a single save's details.

**Features**:

- Full metadata display (title, URL, description, site name)
- Image preview (if available)
- Tag management
- Collection assignment
- Visibility toggle
- Favorite/archive quick actions
- Open in browser button
- Reader mode access (if snapshot available)
- Share save
- Delete with confirmation

### 4. Add Save

**Purpose**: Create new saves manually or via share sheet.

**Features**:

- URL input with validation
- Auto-fetch metadata (title, description, image)
- Custom title override
- Visibility selector (private/public)
- Tag input with autocomplete
- Collection selector
- Notes field

### 5. Reader Mode

**Purpose**: Distraction-free reading of saved articles.

**Features**:

- Clean, formatted article content
- Adjustable font size
- Light/dark/sepia themes
- Estimated reading time
- Byline and publication info
- Share article
- Mark as read/favorite

### 6. Collections

**Purpose**: Organize saves into named groups.

**Features**:

- List all collections with save counts
- Create new collection
- Edit collection name/visibility
- Delete collection
- View saves in collection
- Drag-and-drop reordering (future)

### 7. Tags

**Purpose**: Browse and manage tags.

**Features**:

- List all tags with save counts
- Search/filter tags
- Rename tag
- Delete tag (with confirmation)
- View saves with tag

### 8. Settings

**Purpose**: Configure space and app preferences.

**Features**:

- Profile settings:
  - Display name
  - Bio
- Public space:
  - Visibility toggle
  - Layout preference (grid/list)
  - Subdomain (view only, edit on web)
  - Custom domain (view only)
- App settings:
  - Theme (light/dark/system)
  - Default save visibility
  - Notifications preferences
- Account:
  - View email
  - Sign out

---

## Screen Specifications

### Dashboard Screen (`app/(tabs)/index.tsx`)

```typescript
// Screen: Dashboard
// Route: /(tabs)/

interface DashboardData {
  stats: {
    totalSaves: number;
    favoriteSaves: number;
    publicSaves: number;
    totalTags: number;
    totalCollections: number;
  };
  recentSaves: Save[];
  space: Space;
}

// Layout:
// - Header with avatar and greeting
// - Stats cards row
// - "Recent Saves" section
// - Quick action FAB (add save)
```

### Saves List Screen (`app/(tabs)/saves.tsx`)

```typescript
// Screen: Saves List
// Route: /(tabs)/saves

// Features:
// - SearchBar with filter button
// - View mode toggle (grid/list)
// - FlatList/FlashList for performance
// - Pull-to-refresh
// - Load more on scroll
// - Empty state
// - Error state with retry

// Filters (bottom sheet):
// - All / Favorites / Archived
// - Visibility: All / Public / Private
// - Collection picker
// - Tag picker

// Actions:
// - Tap: Navigate to save detail
// - Long press: Enter selection mode
// - Swipe left: Archive
// - Swipe right: Favorite
```

### Save Detail Screen (`app/save/[id].tsx`)

```typescript
// Screen: Save Detail
// Route: /save/[id]

// Layout:
// - Header with back button and actions menu
// - Image (if available)
// - Title
// - URL with external link button
// - Description
// - Metadata (site name, saved date)
// - Tags section with edit
// - Collections section with edit
// - Reader mode button (if snapshot available)

// Actions menu:
// - Toggle favorite
// - Toggle archive
// - Change visibility
// - Share
// - Delete
```

### Add Save Screen (`app/save/new.tsx`)

```typescript
// Screen: Add Save
// Route: /save/new

// Also handles share sheet input via URL params:
// Route: /save/new?url=https://...&title=...

// Form fields:
// - URL input (required)
// - Title input (optional, auto-fetched)
// - Description/notes (optional)
// - Visibility picker
// - Tags input with suggestions
// - Collections multi-select

// Actions:
// - Cancel: Dismiss
// - Save: Create save and navigate back
```

### Reader Mode Screen (`app/reader/[id].tsx`)

```typescript
// Screen: Reader Mode
// Route: /reader/[id]

// Layout:
// - Minimal header with close and actions
// - Article content (sanitized HTML rendered)
// - Reading progress indicator

// Settings (sheet):
// - Font size slider
// - Theme: Light / Dark / Sepia
// - Font family (optional)

// Actions:
// - Close
// - Share
// - Toggle favorite
// - Open original
```

### Settings Screen (`app/(tabs)/settings.tsx`)

```typescript
// Screen: Settings
// Route: /(tabs)/settings

// Sections:
// 1. Profile
//    - Display name input
//    - Bio textarea
//    - Avatar (view only, managed by Clerk)

// 2. Public Space
//    - Visibility toggle
//    - Layout picker
//    - Subdomain display (with link)
//    - Custom domains list

// 3. Defaults
//    - Default save visibility

// 4. Appearance
//    - Theme selector: System / Light / Dark

// 5. Account
//    - Email display
//    - Manage account button (opens Clerk)
//    - Sign out button

// 6. About
//    - App version
//    - Privacy policy link
//    - Terms link
```

---

## Data Models & Types

```typescript
// lib/types.ts

// === Enums ===

export type SpaceVisibility = "public" | "private";
export type SaveVisibility = "private" | "public";
export type CollectionVisibility = "private" | "public";
export type PublicLayout = "list" | "grid";
export type SnapshotStatus =
  | "pending"
  | "processing"
  | "ready"
  | "blocked"
  | "failed";

// === Core Models ===

export interface Space {
  id: string;
  type: "personal" | "org";
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SpaceVisibility;
  publicLayout: PublicLayout;
  defaultSaveVisibility: SaveVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Save {
  id: string;
  spaceId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  contentType: string | null;
  visibility: SaveVisibility;
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: string;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  collections?: Collection[];
}

export interface Tag {
  id: string;
  spaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    saves: number;
  };
}

export interface Collection {
  id: string;
  spaceId: string;
  name: string;
  visibility: CollectionVisibility;
  createdAt: string;
  updatedAt: string;
  _count?: {
    saves: number;
  };
}

export interface DomainMapping {
  id: string;
  domain: string;
  spaceId: string;
  status: "pending_verification" | "verified" | "active" | "error" | "disabled";
  verificationToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveSnapshot {
  saveId: string;
  status: SnapshotStatus;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  wordCount: number | null;
  language: string | null;
}

export interface SnapshotContent {
  title: string;
  byline: string | null;
  content: string; // Sanitized HTML
  textContent: string; // Plain text
  excerpt: string;
  siteName: string | null;
  length: number;
  language: string | null;
}

// === API Input Types ===

export interface CreateSaveInput {
  url: string;
  title?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
  note?: string;
}

export interface UpdateSaveInput {
  id: string;
  title?: string;
  description?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
}

export interface ListSavesInput {
  query?: string;
  visibility?: SaveVisibility;
  isArchived?: boolean;
  isFavorite?: boolean;
  collectionId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

export interface SpaceSettingsInput {
  name?: string;
  bio?: string;
  visibility?: SpaceVisibility;
  publicLayout?: PublicLayout;
  defaultSaveVisibility?: SaveVisibility;
}

// === API Response Types ===

export interface ListSavesResponse {
  items: Save[];
  nextCursor: string | null;
}

export interface StatsResponse {
  totalSaves: number;
  favoriteSaves: number;
  publicSaves: number;
  archivedSaves: number;
  totalTags: number;
  totalCollections: number;
}
```

---

## Native Integrations

### Share Sheet Integration (iOS & Android)

Allow users to save links directly from any app's share menu.

#### iOS Share Extension

For iOS, create a Share Extension target:

```
backpocket-mobile/
├── share-extension/
│   ├── ShareViewController.swift
│   └── Info.plist
```

The share extension receives the URL and either:

1. Opens the main app with the URL to show the full add form
2. Shows a minimal "Quick Save" UI and saves immediately

#### Android Intent Filter

Android uses intent filters configured in `app.json`:

```json
{
  "android": {
    "intentFilters": [
      {
        "action": "android.intent.action.SEND",
        "category": ["android.intent.category.DEFAULT"],
        "data": [{ "mimeType": "text/plain" }]
      }
    ]
  }
}
```

Handle incoming intents in the app:

```typescript
// app/_layout.tsx
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { router } from "expo-router";

export default function RootLayout() {
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      const { queryParams } = Linking.parse(event.url);
      if (queryParams?.url) {
        router.push({
          pathname: "/save/new",
          params: { url: queryParams.url as string },
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    // Check for initial URL (app opened via share)
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  // ... rest of layout
}
```

### Deep Linking

Configure URL scheme for deep links:

```
backpocket://save/[id]
backpocket://collection/[id]
backpocket://tag/[id]
```

### Haptic Feedback

Use haptics for tactile feedback on actions:

```typescript
import * as Haptics from "expo-haptics";

// Success feedback (save created)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Selection feedback (toggle favorite)
Haptics.selectionAsync();

// Light impact (button press)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

### Clipboard

Read URLs from clipboard for quick paste:

```typescript
import * as Clipboard from "expo-clipboard";

const checkClipboardForUrl = async () => {
  const text = await Clipboard.getStringAsync();
  if (isValidUrl(text)) {
    return text;
  }
  return null;
};
```

---

## UI/UX Guidelines

### Design System

#### Colors (matching web)

```typescript
// lib/constants/colors.ts
export const colors = {
  // Brand colors
  denim: {
    DEFAULT: "#3B5998",
    deep: "#2C4373",
    faded: "#6B8BC4",
  },
  rust: {
    DEFAULT: "#C4533A",
    deep: "#9E3F2C",
  },
  mint: "#4ECDC4",
  teal: "#1ABC9C",
  amber: "#F7B731",

  // Semantic
  background: {
    light: "#FFFFFF",
    dark: "#0A0A0A",
  },
  foreground: {
    light: "#171717",
    dark: "#EDEDED",
  },
  muted: {
    light: "#F5F5F5",
    dark: "#262626",
  },
  border: {
    light: "#E5E5E5",
    dark: "#262626",
  },
};
```

#### Typography

Use system fonts with custom weight mappings:

```typescript
// NativeWind/Tailwind config
fontFamily: {
  sans: ["System"], // SF Pro on iOS, Roboto on Android
  serif: ["Georgia", "serif"],
  mono: ["Menlo", "monospace"],
}
```

#### Spacing

Use 4px grid system:

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px

### Gestures

| Gesture     | Context        | Action               |
| ----------- | -------------- | -------------------- |
| Swipe left  | Save list item | Archive              |
| Swipe right | Save list item | Favorite             |
| Long press  | Save list item | Enter selection mode |
| Pull down   | Any list       | Refresh              |
| Pinch       | Image          | Zoom (optional)      |

### Animations

Use Reanimated for performant animations:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const SaveCard = ({ save }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        {/* ... */}
      </Pressable>
    </Animated.View>
  );
};
```

### Loading States

- Use skeleton screens for initial loads
- Use subtle spinners for actions
- Show optimistic updates for toggles (favorite, archive)

### Empty States

Each list should have a meaningful empty state:

```typescript
const EmptyState = ({ type }: { type: "saves" | "collections" | "tags" }) => {
  const config = {
    saves: {
      icon: Bookmark,
      title: "No saves yet",
      description: "Add your first save to get started",
      action: "Add Save",
    },
    collections: {
      icon: FolderOpen,
      title: "No collections",
      description: "Create collections to organize your saves",
      action: "Create Collection",
    },
    tags: {
      icon: Tag,
      title: "No tags",
      description: "Tags are created when you add them to saves",
      action: null,
    },
  };

  // ... render empty state
};
```

### Error Handling

Show user-friendly error messages:

```typescript
const ErrorView = ({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) => (
  <View className="flex-1 items-center justify-center p-6">
    <AlertCircle size={48} className="text-destructive mb-4" />
    <Text className="text-lg font-medium text-center">
      Something went wrong
    </Text>
    <Text className="text-muted-foreground text-center mt-2">
      {error.message || "Please try again"}
    </Text>
    <Button onPress={onRetry} className="mt-6">
      Try Again
    </Button>
  </View>
);
```

---

## State Management

### Server State (TanStack Query)

All API data is managed via TanStack Query:

```typescript
// lib/api/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Client State (Zustand)

Local UI state managed with Zustand:

```typescript
// lib/store/ui.ts
import { create } from "zustand";

interface UIState {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;

  theme: "system" | "light" | "dark";
  setTheme: (theme: "system" | "light" | "dark") => void;

  selectedSaveIds: Set<string>;
  toggleSelectSave: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: "list",
  setViewMode: (mode) => set({ viewMode: mode }),

  theme: "system",
  setTheme: (theme) => set({ theme }),

  selectedSaveIds: new Set(),
  toggleSelectSave: (id) =>
    set((state) => {
      const next = new Set(state.selectedSaveIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedSaveIds: next };
    }),
  clearSelection: () => set({ selectedSaveIds: new Set() }),
  selectAll: (ids) => set({ selectedSaveIds: new Set(ids) }),
}));
```

### Persisted State

Use MMKV or AsyncStorage with Zustand persist:

```typescript
// lib/store/settings.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  viewMode: "grid" | "list";
  theme: "system" | "light" | "dark";
  readerFontSize: number;
  readerTheme: "light" | "dark" | "sepia";
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      viewMode: "list",
      theme: "system",
      readerFontSize: 16,
      readerTheme: "light",
    }),
    {
      name: "backpocket-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Offline Support

### Strategy

1. **Cache API responses** with TanStack Query's persistence
2. **Queue mutations** when offline
3. **Sync on reconnect**

### Implementation

```typescript
// lib/store/offline.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import NetInfo from "@react-native-community/netinfo";

interface OfflineAction {
  id: string;
  type: "createSave" | "updateSave" | "deleteSave" | "toggleFavorite";
  payload: unknown;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  addAction: (action: Omit<OfflineAction, "id" | "timestamp">) => void;
  removeAction: (id: string) => void;
  syncPendingActions: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingActions: [],

      addAction: (action) => {
        const newAction: OfflineAction = {
          ...action,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));
      },

      removeAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },

      syncPendingActions: async () => {
        const { pendingActions, removeAction } = get();
        for (const action of pendingActions) {
          try {
            // Execute the action against the API
            await executeAction(action);
            removeAction(action.id);
          } catch (err) {
            // Keep in queue for retry
            console.error("Sync failed:", err);
          }
        }
      },
    }),
    {
      name: "backpocket-offline",
    }
  )
);

// Monitor network status
NetInfo.addEventListener((state) => {
  useOfflineStore.setState({ isOnline: state.isConnected ?? false });

  if (state.isConnected) {
    useOfflineStore.getState().syncPendingActions();
  }
});
```

---

## Push Notifications

### Use Cases

- New snapshot ready for reading
- Weekly digest of saves (optional)
- Account security notifications

### Implementation (Expo Notifications)

```typescript
// lib/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token.data;
}
```

---

## App Store Requirements

### iOS App Store

1. **App Information**

   - App Name: Backpocket
   - Subtitle: Save & Share Your Finds
   - Category: Utilities / Productivity
   - Privacy Policy URL: Required

2. **Screenshots**

   - 6.7" (iPhone 14 Pro Max)
   - 6.5" (iPhone 11 Pro Max)
   - 5.5" (iPhone 8 Plus)
   - 12.9" iPad Pro (if supporting tablet)

3. **App Review Notes**
   - Demo account credentials
   - Instructions for testing share extension

### Google Play Store

1. **Store Listing**

   - Title: Backpocket - Save Links & Articles
   - Short description: Save links, read later, share your collection
   - Full description: Feature highlights

2. **Assets**

   - Feature graphic (1024x500)
   - Screenshots (phone & tablet)
   - App icon (512x512)

3. **Content Rating**

   - Complete content rating questionnaire
   - Likely rated E (Everyone)

4. **Privacy**
   - Data safety form required
   - Declare what data is collected

### EAS Build Configuration

```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123"
      },
      "android": {
        "serviceAccountKeyPath": "./pc-api-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## Development Commands

```bash
# Start development server
bun run start

# Start with specific platform
bun run ios
bun run android

# Build development client
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for app stores
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android

# OTA update (after production build)
eas update --branch production --message "Bug fixes"

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint
```

---

## Implementation Phases

### Phase 1: Core Foundation (MVP)

- [ ] Project setup with Expo Router
- [ ] Clerk authentication integration
- [ ] API client with TanStack Query
- [ ] Basic navigation (tabs + stacks)
- [ ] Saves list (view only)
- [ ] Save detail view
- [ ] Add save form

### Phase 2: Full CRUD

- [ ] Edit save
- [ ] Delete save (with confirmation)
- [ ] Toggle favorite/archive
- [ ] Search and filtering
- [ ] View mode toggle (grid/list)

### Phase 3: Organization

- [ ] Collections list and detail
- [ ] Create/edit/delete collections
- [ ] Tags list and filtering
- [ ] Assign tags to saves

### Phase 4: Reader Mode

- [ ] Snapshot content display
- [ ] Reading settings (font, theme)
- [ ] Request snapshot for saves

### Phase 5: Settings & Polish

- [ ] Settings screen
- [ ] Theme support
- [ ] Profile editing
- [ ] Haptic feedback
- [ ] Animations and transitions

### Phase 6: Native Features

- [ ] Share sheet integration (iOS)
- [ ] Share intent handling (Android)
- [ ] Clipboard URL detection
- [ ] Push notifications setup

### Phase 7: Offline & Performance

- [ ] Offline queue for mutations
- [ ] Response caching
- [ ] Performance optimization
- [ ] Memory management

### Phase 8: Release

- [ ] App store assets
- [ ] TestFlight/Internal testing
- [ ] Production build
- [ ] App store submission

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Clerk Expo SDK](https://clerk.com/docs/references/expo/overview)
- [TanStack Query](https://tanstack.com/query/latest)
- [NativeWind](https://www.nativewind.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

---

## Support

For questions or issues, open an issue in the Backpocket repository or contact the maintainers.
