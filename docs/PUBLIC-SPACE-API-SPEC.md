# Backpocket Public Space & Domain API Specification

This document outlines the API endpoints and implementation details for managing a user's Public Space and custom domains from the Backpocket mobile app (React Native).

---

## Table of Contents

1. [Overview](#overview)
2. [Public Link Format](#public-link-format)
3. [API Endpoints](#api-endpoints)
4. [Type Definitions](#type-definitions)
5. [Mobile Implementation Guide](#mobile-implementation-guide)
6. [Feature Parity Matrix](#feature-parity-matrix)
7. [Recommendations](#recommendations)

---

## Overview

The **Public Space** feature allows users to share their public saves at a unique URL. Users can:

1. **Toggle visibility** - Enable/disable their public space
2. **Customize their slug** - Change their subdomain (e.g., `mario` → `mario.backpocket.my`)
3. **Add custom domains** - Use their own domain instead of a subdomain
4. **Configure display settings** - Layout preference, default save visibility

### Base URL

```
Production: https://backpocket.my
API Base:   https://backpocket.my/api/trpc
```

---

## Public Link Format

### ⚠️ Current Mobile Mock (Incorrect)

The mobile app currently shows:

```
https://backpocket.app/@user_37V
```

### ✅ Correct Format

**Subdomain-based (default):**

```
https://{slug}.backpocket.my
```

Example: `https://mario.backpocket.my`

**Custom domain (optional):**

```
https://yourdomain.com
```

### URL Building Logic

```typescript
// Constants
const ROOT_DOMAIN = "backpocket.my"; // from env: NEXT_PUBLIC_ROOT_DOMAIN

// Build the public space URL
function buildPublicSpaceUrl(slug: string): string {
  return `https://${slug}.${ROOT_DOMAIN}`;
}

// Build display hostname (no protocol)
function buildPublicSpaceHostname(slug: string): string {
  return `${slug}.${ROOT_DOMAIN}`;
}

// Examples:
// slug: "mario" → https://mario.backpocket.my
// slug: "reading-list" → https://reading-list.backpocket.my
```

---

## API Endpoints

All endpoints require authentication via Clerk session token:

```http
Authorization: Bearer <clerk_session_token>
```

### 1. Get My Space (Settings)

Fetch the current user's space settings including slug and visibility.

**Endpoint:** `POST /api/trpc/space.getMySpace`

**Request:**

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

### 2. Update Settings

Update space settings including visibility and layout.

**Endpoint:** `POST /api/trpc/space.updateSettings`

**Request:**

```json
{
  "json": {
    "name": "Mario's Links",
    "bio": "A collection of interesting reads",
    "visibility": "public",
    "publicLayout": "grid",
    "defaultSaveVisibility": "private"
  }
}
```

**Input Schema:**

| Field                   | Type                                  | Required | Description                      |
| ----------------------- | ------------------------------------- | -------- | -------------------------------- |
| `name`                  | `string`                              | ❌ No    | Display name for public space    |
| `bio`                   | `string`                              | ❌ No    | Short description                |
| `avatarUrl`             | `string`                              | ❌ No    | Avatar image URL                 |
| `visibility`            | `"public" \| "private"`               | ❌ No    | Space visibility                 |
| `publicLayout`          | `"list" \| "grid"`                    | ❌ No    | How saves are displayed publicly |
| `defaultSaveVisibility` | `"private" \| "public"`               | ❌ No    | Default visibility for new saves |

**Response:** Returns updated space object (same as `getMySpace`).

---

### 3. Update Slug (Subdomain)

Change the user's subdomain/slug.

**Endpoint:** `POST /api/trpc/space.updateSlug`

**Request:**

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
- Regex: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/`

**Reserved Slugs (cannot use):**

```
www, app, api, admin, dashboard, settings, login, logout, register,
signup, signin, signout, auth, oauth, help, support, docs, blog,
about, contact, terms, privacy, public, static, assets, images,
css, js, fonts, media, uploads, files, download, downloads, rss,
feed, sitemap, robots, favicon, manifest, sw, service-worker,
null, undefined, true, false, test, demo, example, sample, backpocket
```

**Error Responses:**

| Code          | Message                                         |
| ------------- | ----------------------------------------------- |
| `BAD_REQUEST` | "This subdomain is reserved and cannot be used" |
| `CONFLICT`    | "This subdomain is already taken"               |

---

### 4. Check Slug Availability

Real-time check if a slug is available (for live validation).

**Endpoint:** `POST /api/trpc/space.checkSlugAvailability`

**Request:**

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

Or if unavailable:

```json
{
  "result": {
    "data": {
      "available": false,
      "reason": "taken"
    }
  }
}
```

**Reason Values:**

- `"reserved"` - Slug is in reserved list
- `"taken"` - Already used by another user
- `"too_short"` - Less than 3 characters
- `"too_long"` - More than 32 characters
- `"invalid_format"` - Doesn't match allowed pattern

---

### 5. List Custom Domains

Get all custom domains for the user's space.

**Endpoint:** `POST /api/trpc/space.listDomains`

**Request:**

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
        "domain": "links.mario.dev",
        "spaceId": "uuid",
        "status": "active",
        "verificationToken": "backpocket-verify-abc123",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Domain Status Values:**

- `"pending_verification"` - DNS not yet verified
- `"verified"` - DNS verified, setting up
- `"active"` - Domain is live and working
- `"error"` - Configuration error
- `"disabled"` - Manually disabled

---

### 6. Get Domain Status (Detailed)

Get detailed status including DNS verification requirements.

**Endpoint:** `POST /api/trpc/space.getDomainStatus`

**Request:**

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "domain": "links.mario.dev",
      "status": "pending_verification",
      "verified": false,
      "misconfigured": false,
      "verification": [
        {
          "type": "TXT",
          "domain": "_vercel.links.mario.dev",
          "value": "vc-domain-verify=abc123..."
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 7. Add Custom Domain

⚠️ **Web-only recommended** - See [Recommendations](#recommendations)

**Endpoint:** `POST /api/trpc/space.addDomain`

**Request:**

```json
{
  "json": {
    "domain": "links.mario.dev"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "domain": "links.mario.dev",
      "status": "pending_verification",
      "verificationRequired": true,
      "verification": [
        {
          "type": "TXT",
          "domain": "_vercel.links.mario.dev",
          "value": "vc-domain-verify=abc123..."
        }
      ]
    }
  }
}
```

---

### 8. Verify Domain

Trigger verification check for a pending domain.

**Endpoint:** `POST /api/trpc/space.verifyDomain`

**Request:**

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "verified": true,
      "status": "active"
    }
  }
}
```

---

### 9. Remove Custom Domain

**Endpoint:** `POST /api/trpc/space.removeDomain`

**Request:**

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

## Type Definitions

```typescript
// Enums
type SpaceVisibility = "public" | "private";
type SaveVisibility = "private" | "public";
type PublicLayout = "list" | "grid";
type DomainStatus =
  | "pending_verification"
  | "verified"
  | "active"
  | "error"
  | "disabled";

// Space (returned by getMySpace)
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
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// Domain
interface DomainMapping {
  id: string;
  domain: string;
  spaceId: string;
  status: DomainStatus;
  verificationToken: string | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// Domain status response
interface DomainStatusResponse {
  id: string;
  domain: string;
  status: DomainStatus;
  verified: boolean;
  misconfigured: boolean;
  verification?: Array<{
    type: string; // "TXT", "CNAME", "A"
    domain: string; // DNS record name
    value: string; // DNS record value
  }>;
  createdAt: string;
}

// Slug availability response
interface SlugAvailability {
  available: boolean;
  reason:
    | "reserved"
    | "taken"
    | "too_short"
    | "too_long"
    | "invalid_format"
    | null;
}
```

---

## Mobile Implementation Guide

### Public Space Settings Screen

```
┌──────────────────────────────────────┐
│  ← Public Space                      │
├──────────────────────────────────────┤
│                                      │
│  VISIBILITY                          │
│  ┌──────────────────────────────┐   │
│  │ 🔓 Public Space        [ON]  │   │
│  │ Your public saves are        │   │
│  │ visible to anyone            │   │
│  └──────────────────────────────┘   │
│                                      │
│  YOUR PUBLIC LINK                    │
│  ┌──────────────────────────────┐   │
│  │ 🌐                           │   │
│  │ https://mario.backpocket.my  │   │
│  │                              │   │
│  │  [Copy]          [Open]      │   │
│  └──────────────────────────────┘   │
│                                      │
│  Share your public link with        │
│  others to let them view your       │
│  public saves and collections.      │
│  Only saves marked as public        │
│  will be visible.                   │
│                                      │
│  ─────────────────────────────────  │
│                                      │
│  CUSTOMIZE SUBDOMAIN                 │
│  ┌──────────────────────────────┐   │
│  │ mario                        │   │
│  │ .backpocket.my      [Change] │   │
│  └──────────────────────────────┘   │
│                                      │
│  ─────────────────────────────────  │
│                                      │
│  CUSTOM DOMAINS                      │
│  ┌──────────────────────────────┐   │
│  │ links.mario.dev      ✓ Active│   │
│  │                      [Remove]│   │
│  └──────────────────────────────┘   │
│                                      │
│  ℹ️ To add a custom domain,         │
│     visit backpocket.my/settings    │
│     on your computer.               │
│                                      │
└──────────────────────────────────────┘
```

### Example React Native Implementation

```typescript
// api/publicSpace.ts
import { getClerkToken } from "./auth";

const API_BASE = "https://backpocket.my";

interface TRPCResponse<T> {
  result: { data: T };
}

async function trpcCall<T>(procedure: string, input: object = {}): Promise<T> {
  const token = await getClerkToken();

  const res = await fetch(`${API_BASE}/api/trpc/${procedure}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ json: input }),
  });

  const data = (await res.json()) as TRPCResponse<T>;

  if ("error" in data) {
    throw new Error((data as any).error.message);
  }

  return data.result.data;
}

// Get user's space settings
export async function getMySpace(): Promise<Space> {
  return trpcCall("space.getMySpace");
}

// Toggle public space visibility
export async function togglePublicSpace(isPublic: boolean): Promise<Space> {
  return trpcCall("space.updateSettings", {
    visibility: isPublic ? "public" : "private",
  });
}

// Update subdomain/slug
export async function updateSlug(slug: string): Promise<Space> {
  return trpcCall("space.updateSlug", { slug });
}

// Check if slug is available (for live validation)
export async function checkSlugAvailability(
  slug: string
): Promise<SlugAvailability> {
  return trpcCall("space.checkSlugAvailability", { slug });
}

// Get list of custom domains
export async function listDomains(): Promise<DomainMapping[]> {
  return trpcCall("space.listDomains");
}

// Remove a custom domain
export async function removeDomain(
  domainId: string
): Promise<{ success: boolean }> {
  return trpcCall("space.removeDomain", { domainId });
}

// Build the public URL for display
export function buildPublicUrl(slug: string): string {
  return `https://${slug}.backpocket.my`;
}
```

### Slug Editing Component Logic

```typescript
// hooks/useSlugEditor.ts
import { useState, useEffect, useCallback } from "react";
import { checkSlugAvailability, updateSlug } from "../api/publicSpace";
import { useDebounce } from "./useDebounce";

export function useSlugEditor(initialSlug: string) {
  const [slug, setSlug] = useState(initialSlug);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<SlugAvailability | null>(
    null
  );

  const debouncedSlug = useDebounce(slug, 300);

  // Normalize input: lowercase, only allowed chars
  const handleChange = useCallback((value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(normalized);
  }, []);

  // Check availability when slug changes
  useEffect(() => {
    if (
      !isEditing ||
      debouncedSlug === initialSlug ||
      debouncedSlug.length < 3
    ) {
      setAvailability(null);
      return;
    }

    let cancelled = false;

    checkSlugAvailability(debouncedSlug)
      .then((result) => {
        if (!cancelled) setAvailability(result);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [debouncedSlug, isEditing, initialSlug]);

  const save = async () => {
    if (slug === initialSlug) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateSlug(slug);
      setIsEditing(false);
    } catch (error) {
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = () => {
    setSlug(initialSlug);
    setIsEditing(false);
    setAvailability(null);
  };

  return {
    slug,
    isEditing,
    isLoading,
    availability,
    setIsEditing,
    handleChange,
    save,
    cancel,
    canSave: availability?.available && slug !== initialSlug && !isLoading,
  };
}
```

---

## Feature Parity Matrix

| Feature                     | Web App | Mobile App | Notes                          |
| --------------------------- | ------- | ---------- | ------------------------------ |
| View public link            | ✅      | ✅         |                                |
| Copy public link            | ✅      | ✅         |                                |
| Open public link            | ✅      | ✅         | Opens in browser               |
| Toggle visibility           | ✅      | ✅         |                                |
| Edit subdomain/slug         | ✅      | ✅         |                                |
| Real-time slug validation   | ✅      | ✅         |                                |
| View custom domains         | ✅      | ✅         |                                |
| Remove custom domain        | ✅      | ✅         |                                |
| **Add custom domain**       | ✅      | ⚠️ Limited | See below                      |
| View DNS instructions       | ✅      | ❌         | Web only                       |
| Verify domain               | ✅      | ⚠️ Limited | Can trigger, but no UI for DNS |
| Set public layout           | ✅      | ✅         |                                |
| Set default save visibility | ✅      | ✅         |                                |

---

## Recommendations

### ✅ Implement on Mobile

1. **Public Space toggle** - Simple on/off switch
2. **Public link display** - Show correct URL format: `https://{slug}.backpocket.my`
3. **Copy/Share public link** - Essential mobile feature
4. **Subdomain editing** - Works well on mobile with validation
5. **View existing custom domains** - Read-only list
6. **Remove custom domains** - Simple deletion

### ⚠️ Web-Only (Recommended)

1. **Add new custom domain** - Requires complex DNS setup flow:

   - User needs to copy DNS records (TXT, CNAME, A)
   - Configure at their DNS provider (Cloudflare, Namecheap, etc.)
   - Wait for propagation (minutes to 48 hours)
   - This flow is significantly better on desktop with copy/paste

2. **DNS verification instructions** - Too complex for mobile:
   - Multiple DNS record types to display
   - External links to provider docs
   - Better UX on larger screen

### Mobile UX Suggestion

For custom domains on mobile, show:

```
┌──────────────────────────────────────┐
│  CUSTOM DOMAINS                      │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ links.mario.dev      ✓ Active│   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 💻 Add Custom Domain         │   │
│  │                              │   │
│  │ Adding a custom domain       │   │
│  │ requires DNS configuration.  │   │
│  │                              │   │
│  │ Visit backpocket.my/settings │   │
│  │ on your computer to set up   │   │
│  │ a custom domain.             │   │
│  │                              │   │
│  │     [Open Settings →]        │   │
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

The "Open Settings" button should deep-link or open `https://backpocket.my/app/settings` in the browser.

---

## DNS Configuration Reference

When displaying existing domains with pending verification, you may want to show status. Here are the DNS targets for reference:

### For Subdomains (CNAME)

```
Target: cname.vercel-dns.com
```

### For Apex/Root Domains (A Record)

```
IP: 76.76.21.21
```

### Verification Record (TXT)

The verification record details are returned by the `getDomainStatus` API.

---

## Quick Reference

### Essential Mobile Endpoints

| Action                     | Endpoint                      | Method |
| -------------------------- | ----------------------------- | ------ |
| Get space settings         | `space.getMySpace`            | POST   |
| Update visibility/settings | `space.updateSettings`        | POST   |
| Change subdomain           | `space.updateSlug`            | POST   |
| Check slug availability    | `space.checkSlugAvailability` | POST   |
| List custom domains        | `space.listDomains`           | POST   |
| Remove domain              | `space.removeDomain`          | POST   |

### Example: Full Mobile Flow

```bash
# 1. Get current settings on screen load
curl -X POST https://backpocket.my/api/trpc/space.getMySpace \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"json":{}}'

# 2. Toggle public space ON
curl -X POST https://backpocket.my/api/trpc/space.updateSettings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"json":{"visibility":"public"}}'

# 3. Check if new slug is available
curl -X POST https://backpocket.my/api/trpc/space.checkSlugAvailability \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"json":{"slug":"mario"}}'

# 4. Update slug
curl -X POST https://backpocket.my/api/trpc/space.updateSlug \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"json":{"slug":"mario"}}'
```

---

## Summary

The mobile app can fully support:

- ✅ Viewing and copying the public link (`https://{slug}.backpocket.my`)
- ✅ Toggling public space visibility
- ✅ Editing the subdomain/slug with real-time validation
- ✅ Viewing and removing existing custom domains

For adding new custom domains, **redirect users to the web app**. The DNS configuration flow is inherently complex and provides a much better experience on desktop where users can easily copy DNS records and switch between tabs.

---

## Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Clerk React Native SDK](https://clerk.com/docs/references/react-native/overview)
- [Vercel Domains API](https://vercel.com/docs/rest-api/endpoints#domains)
