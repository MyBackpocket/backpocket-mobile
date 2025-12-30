/**
 * App constants and configuration
 */

// API Configuration
export const API_URL =
	process.env.EXPO_PUBLIC_API_URL || "https://backpocket.dev";

// Clerk Configuration
export const CLERK_PUBLISHABLE_KEY =
	process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

// App metadata
export const APP_NAME = "Backpocket";
export const APP_SCHEME = "backpocket";

// Feature flags
export const IS_DEV = __DEV__;
