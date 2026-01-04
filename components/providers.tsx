/**
 * App-wide providers wrapper
 * Combines Clerk, React Query, API Client, Theme providers
 */

import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { brandColors, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { APIClientProvider } from "@/lib/api/hooks";
import { tokenCache } from "@/lib/auth/token-cache";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";
import {
	SettingsContext,
	useSettingsStore,
	type ThemePreference,
} from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme/provider";

// Create a React Query client with sensible defaults
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
			retry: 2,
			refetchOnWindowFocus: true,
		},
		mutations: {
			retry: 1,
		},
	},
});

// Custom navigation themes with Backpocket colors
const BackpocketLightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: brandColors.rust.DEFAULT,
		background: Colors.light.background,
		card: Colors.light.card,
		text: Colors.light.text,
		border: Colors.light.border,
		notification: brandColors.rust.DEFAULT,
	},
};

const BackpocketDarkTheme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: brandColors.amber,
		background: Colors.dark.background,
		card: Colors.dark.card,
		text: Colors.dark.text,
		border: Colors.dark.border,
		notification: brandColors.amber,
	},
};

interface ProvidersProps {
	children: React.ReactNode;
}

interface InnerProvidersProps extends ProvidersProps {
	themePreference: ThemePreference;
}

function InnerProviders({ children, themePreference }: InnerProvidersProps) {
	const colorScheme = useColorScheme();

	// Determine effective color scheme based on preference
	const effectiveScheme =
		themePreference === "system" ? colorScheme : themePreference;
	const navigationTheme =
		effectiveScheme === "dark" ? BackpocketDarkTheme : BackpocketLightTheme;

	return (
		<ThemeProvider forcedColorScheme={themePreference}>
			<QueryClientProvider client={queryClient}>
				<APIClientProvider>
					<NavigationThemeProvider value={navigationTheme}>
						{children}
					</NavigationThemeProvider>
				</APIClientProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}

function SettingsWrapper({ children }: ProvidersProps) {
	const settingsStore = useSettingsStore();

	return (
		<SettingsContext.Provider value={settingsStore}>
			<InnerProviders themePreference={settingsStore.settings.theme}>
				{children}
			</InnerProviders>
		</SettingsContext.Provider>
	);
}

export function Providers({ children }: ProvidersProps) {
	// If Clerk key is not configured, render without Clerk (for development)
	if (!CLERK_PUBLISHABLE_KEY) {
		console.warn(
			"[auth] Clerk publishable key not configured. Auth features disabled.",
		);
		return <SettingsWrapper>{children}</SettingsWrapper>;
	}

	return (
		<ClerkProvider
			publishableKey={CLERK_PUBLISHABLE_KEY}
			tokenCache={tokenCache}
		>
			<ClerkLoaded>
				<SettingsWrapper>{children}</SettingsWrapper>
			</ClerkLoaded>
		</ClerkProvider>
	);
}
