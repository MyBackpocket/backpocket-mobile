/**
 * React Query Client Configuration for React Native
 *
 * Sets up platform-specific adapters for proper focus/refetch behavior:
 * - focusManager: Uses AppState to detect app foreground/background
 * - onlineManager: (Optional) Uses NetInfo to detect network connectivity
 */

import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Configure React Query's focusManager to work with React Native's AppState.
 * This ensures queries refetch properly when the app comes to the foreground.
 */
function setupFocusManager() {
	focusManager.setEventListener((handleFocus) => {
		const subscription = AppState.addEventListener(
			"change",
			(status: AppStateStatus) => {
				handleFocus(status === "active");
			},
		);

		return () => {
			subscription.remove();
		};
	});
}

// Initialize focus manager on module load
setupFocusManager();

/**
 * Pre-configured QueryClient for React Native with sensible defaults.
 *
 * - staleTime: 1 minute (data considered fresh for 1 min)
 * - gcTime: 30 minutes (unused data kept in cache for 30 min)
 * - retry: 2 attempts for failed queries
 * - refetchOnWindowFocus: true (now works with focusManager setup above)
 * - refetchOnMount: true (ensures fresh data when navigating back)
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minute
			gcTime: 1000 * 60 * 30, // 30 minutes
			retry: 2,
			refetchOnWindowFocus: true,
			refetchOnMount: true,
		},
		mutations: {
			retry: 0, // Disable retry for mutations to make debugging easier
		},
	},
});
