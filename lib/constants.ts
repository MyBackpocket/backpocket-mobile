/**
 * App constants and configuration
 */

// API Configuration
export const API_URL =
	process.env.EXPO_PUBLIC_API_URL || "https://backpocket.dev";

// Public Space Configuration
export const ROOT_DOMAIN = "backpocket.my";

/**
 * Build the public space URL for a given slug
 */
export function buildPublicSpaceUrl(slug: string): string {
	return `https://${slug}.${ROOT_DOMAIN}`;
}

/**
 * Build the public space hostname (without protocol)
 */
export function buildPublicSpaceHostname(slug: string): string {
	return `${slug}.${ROOT_DOMAIN}`;
}

// Clerk Configuration
export const CLERK_PUBLISHABLE_KEY =
	process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

// App metadata
export const APP_NAME = "Backpocket";
export const APP_SCHEME = "backpocket";

// Feature flags
export const IS_DEV = __DEV__;
