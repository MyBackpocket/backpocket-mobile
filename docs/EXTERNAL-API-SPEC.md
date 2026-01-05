# Backpocket API Reference for External Consumers

This document outlines all available API endpoints for external consumers: **browser extensions**, **mobile apps**, and other clients.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Quick Reference](#api-quick-reference)
4. [Endpoint Details](#endpoint-details)
   - [Saves](#saves)
   - [Tags](#tags)
   - [Collections](#collections)
   - [Settings & Space](#settings--space)
   - [Domains](#domains)
   - [Stats](#stats)
   - [Snapshots](#snapshots)
   - [Public (Unauthenticated)](#public-unauthenticated)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Implementation Guides](#implementation-guides)
8. [URL Normalization](#url-normalization)
9. [Changelog](#changelog)

---

## Overview

### Base URL

```
Production: https://backpocket.dev
API Base:   https://backpocket.dev/api/trpc
```

### API Architecture

Backpocket uses [tRPC](https://trpc.io) for its API layer. All endpoints follow this pattern:

```
POST /api/trpc/<router>.<procedure>
```

### Router Namespaces

| Router     | Auth Required | Description                      |
| ---------- | ------------- | -------------------------------- |
| `space.*`  | ✅ Yes        | User's personal space operations |
| `public.*` | ❌ No         | Public read-only operations      |

---

## Authentication

Backpocket uses [Clerk](https://clerk.com) for authentication.

### Getting the Auth Token

```typescript
import { useAuth } from "@clerk/chrome-extension"; // or @clerk/clerk-react for mobile

const { getToken } = useAuth();
const token = await getToken();
```

### Request Headers

```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### Request Body Format (tRPC)

```json
{
  "json": {
    // your input data
  }
}
```

---

## API Quick Reference

### 🔖 Saves (Authenticated)

| Action            | Endpoint                | Method | Consumer |
| ----------------- | ----------------------- | ------ | -------- |
| Create a save     | `space.createSave`      | POST   | ✅ All   |
| Check duplicate   | `space.checkDuplicate`  | POST   | ✅ All   |
| List saves        | `space.listSaves`       | POST   | ✅ All   |
| Get single save   | `space.getSave`         | POST   | ✅ All   |
| Update save       | `space.updateSave`      | POST   | ✅ All   |
| Toggle favorite   | `space.toggleFavorite`  | POST   | ✅ All   |
| Toggle archive    | `space.toggleArchive`   | POST   | ✅ All   |
| Delete save       | `space.deleteSave`      | POST   | ✅ All   |
| Bulk delete saves | `space.bulkDeleteSaves` | POST   | ✅ All   |

### 🏷️ Tags (Authenticated)

| Action     | Endpoint          | Method | Consumer |
| ---------- | ----------------- | ------ | -------- |
| List tags  | `space.listTags`  | POST   | ✅ All   |
| Create tag | `space.createTag` | POST   | ✅ All   |
| Update tag | `space.updateTag` | POST   | ✅ All   |
| Delete tag | `space.deleteTag` | POST   | ✅ All   |

### 📁 Collections (Authenticated)

| Action            | Endpoint                 | Method | Consumer |
| ----------------- | ------------------------ | ------ | -------- |
| List collections  | `space.listCollections`  | POST   | ✅ All   |
| Create collection | `space.createCollection` | POST   | ✅ All   |
| Update collection | `space.updateCollection` | POST   | ✅ All   |
| Delete collection | `space.deleteCollection` | POST   | ✅ All   |

### ⚙️ Settings & Space (Authenticated)

| Action                  | Endpoint                      | Method | Consumer |
| ----------------------- | ----------------------------- | ------ | -------- |
| Get my space            | `space.getMySpace`            | POST   | ✅ All   |
| Update settings         | `space.updateSettings`        | POST   | ✅ All   |
| Update slug             | `space.updateSlug`            | POST   | ✅ All   |
| Check slug availability | `space.checkSlugAvailability` | POST   | ✅ All   |

### 🌐 Domains (Authenticated)

| Action            | Endpoint                | Method | Consumer    |
| ----------------- | ----------------------- | ------ | ----------- |
| List domains      | `space.listDomains`     | POST   | ✅ All      |
| Add domain        | `space.addDomain`       | POST   | ⚠️ Web only |
| Verify domain     | `space.verifyDomain`    | POST   | ⚠️ Web only |
| Get domain status | `space.getDomainStatus` | POST   | ✅ All      |
| Remove domain     | `space.removeDomain`    | POST   | ✅ All      |

### 📊 Stats (Authenticated)

| Action             | Endpoint                 | Method | Consumer |
| ------------------ | ------------------------ | ------ | -------- |
| Get stats          | `space.getStats`         | POST   | ✅ All   |
| Get dashboard data | `space.getDashboardData` | POST   | ✅ All   |

### 📸 Snapshots (Authenticated)

| Action             | Endpoint                    | Method | Consumer |
| ------------------ | --------------------------- | ------ | -------- |
| Get save snapshot  | `space.getSaveSnapshot`     | POST   | ✅ All   |
| Request snapshot   | `space.requestSaveSnapshot` | POST   | ✅ All   |
| Get snapshot quota | `space.getSnapshotQuota`    | POST   | ✅ All   |

### 🔓 Public (No Auth Required)

| Action                | Endpoint                       | Method | Consumer |
| --------------------- | ------------------------------ | ------ | -------- |
| Resolve space by host | `public.resolveSpaceByHost`    | POST   | ✅ All   |
| Resolve space by slug | `public.resolveSpaceBySlug`    | POST   | ✅ All   |
| List public saves     | `public.listPublicSaves`       | POST   | ✅ All   |
| Get public save       | `public.getPublicSave`         | POST   | ✅ All   |
| Get public snapshot   | `public.getPublicSaveSnapshot` | POST   | ✅ All   |
| Register visit        | `public.registerVisit`         | POST   | ✅ All   |
| Get visit count       | `public.getVisitCount`         | POST   | ✅ All   |

---

## Endpoint Details

### Saves

#### Create Save (Primary Endpoint for Extensions)

**Endpoint:** `POST /api/trpc/space.createSave`

This is the most important endpoint for browser extensions and share sheets.

**Request:**

```json
{
  "json": {
    "url": "https://example.com/article",
    "title": "Optional custom title",
    "visibility": "private",
    "tagNames": ["reading", "tech"],
    "collectionIds": ["uuid-1", "uuid-2"],
    "note": "Optional description/note"
  }
}
```

**Input Schema:**

| Field           | Type                                  | Required | Default     | Description                                 |
| --------------- | ------------------------------------- | -------- | ----------- | ------------------------------------------- |
| `url`           | `string`                              | ✅ Yes   | -           | Valid URL to save                           |
| `title`         | `string`                              | ❌ No    | null        | Custom title (auto-fetched if not provided) |
| `visibility`    | `"private" \| "public" \| "unlisted"` | ❌ No    | `"private"` | Save visibility                             |
| `tagNames`      | `string[]`                            | ❌ No    | `[]`        | Tag names to attach (auto-created)          |
| `collectionIds` | `string[]`                            | ❌ No    | `[]`        | Collection IDs to add to                    |
| `note`          | `string`                              | ❌ No    | null        | Description/notes                           |

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "spaceId": "uuid",
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": null,
      "siteName": null,
      "imageUrl": null,
      "contentType": null,
      "visibility": "private",
      "isArchived": false,
      "isFavorite": false,
      "createdBy": "user_xxx",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": [{ "id": "uuid", "name": "reading", ... }],
      "collections": []
    }
  }
}
```

**Notes:**

- Tags are automatically created if they don't exist
- Tag names are normalized to lowercase and trimmed
- A user's space is auto-created on first save if it doesn't exist
- Snapshots are automatically queued when a save is created
- **Duplicate Detection:** URLs are normalized before saving (tracking params stripped, www removed, etc.). If a duplicate is detected, a `CONFLICT` error is returned with the existing save info.

**Duplicate Error Response (HTTP 409):**

```json
{
  "error": {
    "message": "You already have this link saved",
    "code": -32600,
    "data": {
      "code": "CONFLICT",
      "httpStatus": 409,
      "path": "space.createSave",
      "cause": {
        "type": "DUPLICATE_SAVE",
        "existingSave": {
          "id": "uuid",
          "url": "https://example.com/article",
          "title": "Article Title",
          "imageUrl": "https://...",
          "siteName": "Example",
          "savedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    }
  }
}
```

**Handling Duplicates:**

```typescript
const res = await fetch("https://backpocket.dev/api/trpc/space.createSave", {
  method: "POST",
  headers: { ... },
  body: JSON.stringify({ json: { url: "https://example.com" } }),
});

const data = await res.json();

if (data.error?.data?.cause?.type === "DUPLICATE_SAVE") {
  const existingSave = data.error.data.cause.existingSave;
  // Show user: "Already saved on {existingSave.savedAt}"
  // Offer: View existing | Try different URL
}
```

---

#### Check Duplicate

**Endpoint:** `POST /api/trpc/space.checkDuplicate`

Pre-check if a URL already exists before saving. Useful for showing instant feedback to users.

**Request:**

```json
{
  "json": {
    "url": "https://example.com/article?utm_source=twitter"
  }
}
```

**Response (No Duplicate):**

```json
{
  "result": {
    "data": null
  }
}
```

**Response (Duplicate Found):**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "url": "https://example.com/article",
      "title": "Article Title",
      "imageUrl": "https://...",
      "siteName": "Example",
      "savedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Notes:**

- URL is normalized before checking (tracking params stripped, www removed, etc.)
- Returns `null` if no duplicate found
- Returns existing save info if duplicate exists

---

#### List Saves

**Endpoint:** `POST /api/trpc/space.listSaves`

**Request:**

```json
{
  "json": {
    "query": "search term",
    "visibility": "private",
    "isArchived": false,
    "isFavorite": true,
    "collectionId": "uuid",
    "tagId": "uuid",
    "cursor": "2024-01-01T00:00:00.000Z",
    "limit": 20
  }
}
```

**Input Schema:**

| Field          | Type                                  | Required | Default | Description                     |
| -------------- | ------------------------------------- | -------- | ------- | ------------------------------- |
| `query`        | `string`                              | ❌ No    | -       | Search in title/description/url |
| `visibility`   | `"private" \| "public" \| "unlisted"` | ❌ No    | -       | Filter by visibility            |
| `isArchived`   | `boolean`                             | ❌ No    | -       | Filter archived saves           |
| `isFavorite`   | `boolean`                             | ❌ No    | -       | Filter favorites                |
| `collectionId` | `string`                              | ❌ No    | -       | Filter by collection            |
| `tagId`        | `string`                              | ❌ No    | -       | Filter by tag                   |
| `cursor`       | `string`                              | ❌ No    | -       | Pagination cursor (ISO date)    |
| `limit`        | `number`                              | ❌ No    | 20      | Results per page (1-50)         |

**Response:**

```json
{
  "result": {
    "data": {
      "items": [
        /* Save objects */
      ],
      "nextCursor": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Get Save

**Endpoint:** `POST /api/trpc/space.getSave`

```json
{
  "json": {
    "saveId": "uuid"
  }
}
```

---

#### Update Save

**Endpoint:** `POST /api/trpc/space.updateSave`

```json
{
  "json": {
    "id": "uuid",
    "title": "New title",
    "description": "New description",
    "visibility": "public",
    "tagNames": ["new", "tags"],
    "collectionIds": ["uuid-1"]
  }
}
```

All fields except `id` are optional.

---

#### Toggle Favorite

**Endpoint:** `POST /api/trpc/space.toggleFavorite`

```json
{
  "json": {
    "saveId": "uuid",
    "value": true
  }
}
```

`value` is optional - omit to toggle current state.

---

#### Toggle Archive

**Endpoint:** `POST /api/trpc/space.toggleArchive`

```json
{
  "json": {
    "saveId": "uuid",
    "value": true
  }
}
```

---

#### Delete Save

**Endpoint:** `POST /api/trpc/space.deleteSave`

```json
{
  "json": {
    "saveId": "uuid"
  }
}
```

---

#### Bulk Delete Saves

**Endpoint:** `POST /api/trpc/space.bulkDeleteSaves`

```json
{
  "json": {
    "saveIds": ["uuid-1", "uuid-2", "uuid-3"]
  }
}
```

Max 100 saves per request.

---

### Tags

#### List Tags

**Endpoint:** `POST /api/trpc/space.listTags`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": "uuid",
        "spaceId": "uuid",
        "name": "reading",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": { "saves": 5 }
      }
    ]
  }
}
```

---

#### Create Tag

**Endpoint:** `POST /api/trpc/space.createTag`

```json
{
  "json": {
    "name": "new-tag"
  }
}
```

**Note:** Tags are automatically created via `createSave` when using `tagNames`, so this endpoint is optional.

---

#### Update Tag

**Endpoint:** `POST /api/trpc/space.updateTag`

```json
{
  "json": {
    "id": "uuid",
    "name": "renamed-tag"
  }
}
```

---

#### Delete Tag

**Endpoint:** `POST /api/trpc/space.deleteTag`

```json
{
  "json": {
    "tagId": "uuid"
  }
}
```

---

### Collections

#### List Collections

**Endpoint:** `POST /api/trpc/space.listCollections`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": "uuid",
        "spaceId": "uuid",
        "name": "Reading List",
        "visibility": "private",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": { "saves": 10 }
      }
    ]
  }
}
```

---

#### Create Collection

**Endpoint:** `POST /api/trpc/space.createCollection`

```json
{
  "json": {
    "name": "My Collection",
    "visibility": "private"
  }
}
```

---

#### Update Collection

**Endpoint:** `POST /api/trpc/space.updateCollection`

```json
{
  "json": {
    "id": "uuid",
    "name": "Renamed Collection",
    "visibility": "public"
  }
}
```

---

#### Delete Collection

**Endpoint:** `POST /api/trpc/space.deleteCollection`

```json
{
  "json": {
    "collectionId": "uuid"
  }
}
```

---

### Settings & Space

#### Get My Space

**Endpoint:** `POST /api/trpc/space.getMySpace`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "type": "personal",
      "slug": "mario",
      "name": "Mario's Links",
      "bio": "A collection of interesting reads",
      "avatarUrl": "https://...",
      "visibility": "public",
      "publicLayout": "grid",
      "defaultSaveVisibility": "private",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Update Settings

**Endpoint:** `POST /api/trpc/space.updateSettings`

```json
{
  "json": {
    "name": "Mario's Links",
    "bio": "A collection of interesting reads",
    "avatarUrl": "https://...",
    "visibility": "public",
    "publicLayout": "grid",
    "defaultSaveVisibility": "private"
  }
}
```

All fields are optional.

| Field                   | Type                                  | Description                      |
| ----------------------- | ------------------------------------- | -------------------------------- |
| `name`                  | `string`                              | Display name for public space    |
| `bio`                   | `string`                              | Short description                |
| `avatarUrl`             | `string`                              | Avatar image URL                 |
| `visibility`            | `"public" \| "private"`               | Space visibility                 |
| `publicLayout`          | `"list" \| "grid"`                    | How saves are displayed publicly |
| `defaultSaveVisibility` | `"private" \| "public" \| "unlisted"` | Default visibility for new saves |

---

#### Update Slug

**Endpoint:** `POST /api/trpc/space.updateSlug`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Validation Rules:**

- 3-32 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with a hyphen
- Cannot use reserved slugs (www, app, api, admin, etc.)

---

#### Check Slug Availability

**Endpoint:** `POST /api/trpc/space.checkSlugAvailability`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "available": true,
      "reason": null
    }
  }
}
```

**Reason values when unavailable:**

- `"reserved"` - Slug is in reserved list
- `"taken"` - Already used by another user
- `"too_short"` - Less than 3 characters
- `"too_long"` - More than 32 characters
- `"invalid_format"` - Doesn't match allowed pattern

---

### Domains

⚠️ **Note:** Adding domains requires DNS configuration. Recommend web-only for `addDomain`.

#### List Domains

**Endpoint:** `POST /api/trpc/space.listDomains`

```json
{
  "json": {}
}
```

---

#### Get Domain Status

**Endpoint:** `POST /api/trpc/space.getDomainStatus`

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

---

#### Remove Domain

**Endpoint:** `POST /api/trpc/space.removeDomain`

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

---

### Stats

#### Get Stats

**Endpoint:** `POST /api/trpc/space.getStats`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "totalSaves": 150,
      "publicSaves": 45,
      "privateSaves": 105,
      "favorites": 20,
      "archived": 10,
      "collections": 5,
      "tags": 25,
      "visitCount": 1234
    }
  }
}
```

---

#### Get Dashboard Data

**Endpoint:** `POST /api/trpc/space.getDashboardData`

Combined endpoint that returns space settings, stats, and recent saves in one call.

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "space": {
        /* Space object */
      },
      "stats": {
        "totalSaves": 150,
        "publicSaves": 45,
        "favorites": 20,
        "collections": 5,
        "tags": 25,
        "visitCount": 1234
      },
      "recentSaves": [
        /* Last 5 saves */
      ]
    }
  }
}
```

---

### Snapshots

Snapshots capture readable content from saved URLs for offline reading.

#### Get Save Snapshot

**Endpoint:** `POST /api/trpc/space.getSaveSnapshot`

```json
{
  "json": {
    "saveId": "uuid",
    "includeContent": true
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "snapshot": {
        "saveId": "uuid",
        "status": "ready",
        "fetchedAt": "2024-01-01T00:00:00.000Z",
        "title": "Article Title",
        "byline": "Author Name",
        "excerpt": "Article excerpt...",
        "wordCount": 1500,
        "language": "en"
      },
      "content": {
        "content": "<article>...</article>",
        "textContent": "Plain text version..."
      }
    }
  }
}
```

**Snapshot Status Values:**

- `"pending"` - Waiting to be processed
- `"processing"` - Currently being fetched
- `"ready"` - Content available
- `"failed"` - Fetch failed
- `"blocked"` - Site blocks scraping

---

#### Request Save Snapshot

**Endpoint:** `POST /api/trpc/space.requestSaveSnapshot`

Manually request a snapshot (useful for re-snapshotting).

```json
{
  "json": {
    "saveId": "uuid",
    "force": false
  }
}
```

Set `force: true` to re-snapshot an existing save.

---

#### Get Snapshot Quota

**Endpoint:** `POST /api/trpc/space.getSnapshotQuota`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "enabled": true,
      "used": 45,
      "remaining": 55,
      "limit": 100
    }
  }
}
```

---

### Public (Unauthenticated)

These endpoints don't require authentication and are used for public space pages.

#### Resolve Space by Slug

**Endpoint:** `POST /api/trpc/public.resolveSpaceBySlug`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "slug": "mario",
      "name": "Mario's Links",
      "bio": "...",
      "avatarUrl": "https://...",
      "publicLayout": "grid",
      "visitCount": 1234
    }
  }
}
```

---

#### List Public Saves

**Endpoint:** `POST /api/trpc/public.listPublicSaves`

```json
{
  "json": {
    "spaceId": "uuid",
    "cursor": "2024-01-01T00:00:00.000Z",
    "limit": 20
  }
}
```

---

#### Get Public Save

**Endpoint:** `POST /api/trpc/public.getPublicSave`

```json
{
  "json": {
    "spaceId": "uuid",
    "saveId": "uuid"
  }
}
```

---

#### Get Public Save Snapshot

**Endpoint:** `POST /api/trpc/public.getPublicSaveSnapshot`

```json
{
  "json": {
    "spaceId": "uuid",
    "saveId": "uuid",
    "includeContent": true
  }
}
```

---

## Type Definitions

```typescript
// === Enums ===
type SaveVisibility = "private" | "public" | "unlisted";
type SpaceVisibility = "public" | "private";
type PublicLayout = "list" | "grid";
type SnapshotStatus = "pending" | "processing" | "ready" | "failed" | "blocked";

// === Save ===
interface Save {
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
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
  collections?: Collection[];
}

// === Tag ===
interface Tag {
  id: string;
  spaceId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { saves: number };
}

// === Collection ===
interface Collection {
  id: string;
  spaceId: string;
  name: string;
  visibility: "private" | "public";
  createdAt: Date;
  updatedAt: Date;
  _count?: { saves: number };
}

// === Space ===
interface Space {
  id: string;
  type: "personal" | "org";
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SpaceVisibility;
  publicLayout: PublicLayout;
  defaultSaveVisibility: SaveVisibility;
  createdAt: Date;
  updatedAt: Date;
}

// === Snapshot ===
interface SaveSnapshot {
  saveId: string;
  spaceId: string;
  status: SnapshotStatus;
  blockedReason: string | null;
  fetchedAt: Date | null;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  wordCount: number | null;
  language: string | null;
}

interface SnapshotContent {
  content: string; // HTML content
  textContent: string; // Plain text
}

// === Stats ===
interface SpaceStats {
  totalSaves: number;
  publicSaves: number;
  privateSaves: number;
  favorites: number;
  archived: number;
  collections: number;
  tags: number;
  visitCount: number;
}
```

---

## Error Handling

### tRPC Error Format

```json
{
  "error": {
    "message": "Error description",
    "code": -32600,
    "data": {
      "code": "UNAUTHORIZED",
      "httpStatus": 401,
      "path": "space.createSave"
    }
  }
}
```

### Common Error Codes

| tRPC Code               | HTTP Status | Description                    |
| ----------------------- | ----------- | ------------------------------ |
| `UNAUTHORIZED`          | 401         | Not authenticated              |
| `NOT_FOUND`             | 404         | Resource not found             |
| `BAD_REQUEST`           | 400         | Invalid input                  |
| `CONFLICT`              | 409         | Resource conflict (e.g., slug) |
| `TOO_MANY_REQUESTS`     | 429         | Rate limit exceeded            |
| `PRECONDITION_FAILED`   | 412         | Feature disabled               |
| `INTERNAL_SERVER_ERROR` | 500         | Server error                   |

### Error Handling Example

```typescript
async function apiCall<T>(
  endpoint: string,
  input: object,
  token: string
): Promise<T> {
  const res = await fetch(`https://backpocket.dev/api/trpc/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ json: input }),
  });

  const data = await res.json();

  if (data.error) {
    const errorCode = data.error.data?.code;
    switch (errorCode) {
      case "UNAUTHORIZED":
        throw new Error("Please sign in again");
      case "NOT_FOUND":
        throw new Error("Resource not found");
      case "TOO_MANY_REQUESTS":
        throw new Error("Too many requests. Please try again later.");
      default:
        throw new Error(data.error.message || "Something went wrong");
    }
  }

  return data.result.data;
}
```

---

## Implementation Guides

### Browser Extension (Quick Start)

Use [WXT](https://wxt.dev/) framework with `@clerk/chrome-extension`:

```bash
bunx wxt@latest init backpocket-extension -t react
cd backpocket-extension
bun add @clerk/chrome-extension
```

**Minimal save implementation:**

```typescript
import { useAuth } from "@clerk/chrome-extension";

async function quickSave() {
  const { getToken } = useAuth();
  const token = await getToken();

  // Get current tab
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  // Save to Backpocket
  await fetch("https://backpocket.dev/api/trpc/space.createSave", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      json: {
        url: tab.url,
        title: tab.title,
        tagNames: ["from-extension"],
      },
    }),
  });
}
```

### Mobile App (React Native)

Use `@clerk/clerk-expo` or `@clerk/clerk-react`:

```typescript
import { useAuth } from "@clerk/clerk-expo";

export function useSaveLink() {
  const { getToken } = useAuth();

  async function saveLink(url: string, tagNames?: string[]) {
    const token = await getToken();

    const res = await fetch(
      "https://backpocket.dev/api/trpc/space.createSave",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: { url, tagNames },
        }),
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.result.data;
  }

  return { saveLink };
}
```

---

## Consumer-Specific Recommendations

### 🧩 Browser Extension

**Essential endpoints:**

- `space.createSave` - Primary functionality (handles duplicates automatically)
- `space.checkDuplicate` - Pre-check before saving for instant UX feedback
- `space.listTags` - For tag autocomplete

**Optional:**

- `space.listCollections` - For collection picker

**Duplicate Handling:**

When `createSave` returns a `CONFLICT` error with `cause.type === "DUPLICATE_SAVE"`, show the user:

- The existing save info (title, saved date)
- Options: "View existing" or "Try different URL"

### 📱 Mobile App

**Essential endpoints:**

- `space.createSave` - Share sheet integration (handles duplicates automatically)
- `space.checkDuplicate` - Pre-check in share sheet for instant feedback
- `space.listSaves` - Main list view
- `space.listTags` / `space.listCollections` - Filtering
- `space.getDashboardData` - Home screen

**Settings:**

- `space.getMySpace` - Profile settings
- `space.updateSettings` - Update preferences
- `space.updateSlug` - Change subdomain

**Duplicate Handling:**

For share sheet UX, call `checkDuplicate` immediately when a URL is shared. If duplicate found:

- Show "Already saved [time ago]" with existing save preview
- Offer: "View" | "Open in App" | "Cancel"

### 🌐 Public Space Consumers

All `public.*` endpoints are unauthenticated and suitable for:

- RSS readers
- Social sharing previews
- Third-party integrations

---

## URL Normalization

When saving URLs, Backpocket normalizes them for duplicate detection. This means the same content won't be saved twice even if the URLs differ slightly.

### Normalization Rules

| Transformation        | Example                                  |
| --------------------- | ---------------------------------------- |
| Strip tracking params | `?utm_source=twitter` → removed          |
| Remove `www.`         | `www.example.com` → `example.com`        |
| Lowercase hostname    | `Example.COM` → `example.com`            |
| Remove default ports  | `:443` (https) or `:80` (http) → removed |
| Sort query params     | `?b=2&a=1` → `?a=1&b=2`                  |
| Remove trailing slash | `/path/` → `/path`                       |
| Remove hash fragments | `#section` → removed                     |

### Tracking Parameters Stripped

The following parameter prefixes/names are stripped:

- **UTM:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, etc.
- **Facebook:** `fbclid`, `fb_action_ids`, `fb_source`, etc.
- **Google:** `gclid`, `gclsrc`, `dclid`, `gbraid`, `wbraid`
- **Twitter/X:** `twclid`
- **Microsoft:** `msclkid`
- **Common:** `ref`, `ref_src`, `source`, `src`, `affiliate`, `partner`
- **Email:** `mc_cid`, `mc_eid`, `mkt_tok`, `_hsenc`, `_hsmi`
- **Analytics:** `_ga`, `_gl`, `s_kwcid`
- And many more...

### Content Parameters Preserved

These parameters affect content and are **not** stripped:

- `v`, `t`, `list` (YouTube)
- `q`, `query`, `search` (Search)
- `page`, `p`, `offset`, `limit` (Pagination)
- `sort`, `order`, `filter`, `category`, `tag` (Filtering)
- `id`, `article`, `post`, `tab`, `section` (Content IDs)

---

## Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Clerk Browser Extension SDK](https://clerk.com/docs/references/chrome-extension/overview)
- [Clerk React Native SDK](https://clerk.com/docs/references/react-native/overview)
- [WXT Framework](https://wxt.dev/)

---

## Changelog

### 2026-01-05

#### Added

- **Duplicate Detection:** `createSave` now returns a `CONFLICT` error with existing save details when attempting to save a duplicate URL
- **New Endpoint:** `space.checkDuplicate` - Pre-check if a URL exists before saving
- **URL Normalization:** URLs are automatically cleaned before saving/checking:
  - Tracking parameters (UTM, fbclid, gclid, etc.) are stripped
  - `www.` prefix is removed
  - Hostname is lowercased
  - Query params are sorted for consistency
  - Trailing slashes and hash fragments are removed

#### Migration Notes

- Existing saves will work normally. The `normalized_url` column is populated for new saves automatically.
- To backfill existing saves for duplicate detection, run the migration script (see deployment docs).

---

## Support

For questions or issues, open an issue in the Backpocket repository.
