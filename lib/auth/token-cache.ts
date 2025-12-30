/**
 * Secure token cache for Clerk authentication
 * Uses expo-secure-store for encrypted storage on device
 */

import type { TokenCache } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

/**
 * Token cache implementation using SecureStore
 * Stores Clerk session tokens securely on the device
 */
export const tokenCache: TokenCache = {
	async getToken(key: string): Promise<string | null> {
		try {
			const value = await SecureStore.getItemAsync(key);
			return value;
		} catch (error) {
			console.warn("[auth] Failed to get token from secure store:", error);
			return null;
		}
	},

	async saveToken(key: string, value: string): Promise<void> {
		try {
			await SecureStore.setItemAsync(key, value);
		} catch (error) {
			console.warn("[auth] Failed to save token to secure store:", error);
		}
	},

	async clearToken(key: string): Promise<void> {
		try {
			await SecureStore.deleteItemAsync(key);
		} catch (error) {
			console.warn("[auth] Failed to clear token from secure store:", error);
		}
	},
};
