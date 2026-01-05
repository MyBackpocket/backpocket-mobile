/**
 * Not Found / Catch-all Route
 *
 * This handles unmatched routes, including the expo-share-intent deep link format.
 * When expo-share-intent opens the app with `backpocket://dataUrl=backpocketShareKey#type`,
 * Expo Router doesn't recognize this as a valid path. We catch it here and redirect
 * to the /share route where useShareIntent will read the shared data from UserDefaults.
 */

import * as Linking from "expo-linking";
import { Redirect, useGlobalSearchParams, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

export default function NotFoundScreen() {
	const pathname = usePathname();
	const params = useGlobalSearchParams();
	const colors = useThemeColors();
	const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

	useEffect(() => {
		// Debug logging
		console.log("[+not-found] === Not Found Screen ===");
		console.log("[+not-found] pathname:", pathname);
		console.log("[+not-found] params:", JSON.stringify(params, null, 2));

		// Get initial URL for more context
		Linking.getInitialURL().then((url) => {
			console.log("[+not-found] Initial URL:", url);
		});

		// Check if this is an expo-share-intent deep link
		// Format: backpocket://dataUrl=backpocketShareKey#type
		const isShareIntent =
			pathname.includes("dataUrl") ||
			pathname.includes("backpocketShareKey") ||
			Object.keys(params).some(
				(key) =>
					key.includes("dataUrl") ||
					key.includes("backpocketShareKey") ||
					key === "weburl" ||
					key === "media" ||
					key === "text" ||
					key === "file",
			);

		console.log("[+not-found] isShareIntent:", isShareIntent);

		if (isShareIntent) {
			console.log("[+not-found] Redirecting to /share");
			setShouldRedirect("/share");
			return;
		}

		// For other unmatched routes, redirect to home
		console.log("[+not-found] Redirecting to /(tabs)");
		setShouldRedirect("/(tabs)");
	}, [pathname, params]);

	// Redirect once we've determined where to go
	if (shouldRedirect) {
		return <Redirect href={shouldRedirect as "/(tabs)"} />;
	}

	// Show loading while determining redirect
	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<ActivityIndicator size="large" color={brandColors.rust.DEFAULT} />
			<Text style={[styles.text, { color: colors.mutedForeground }]}>
				Loading...
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 16,
	},
	text: {
		fontSize: 16,
		fontFamily: "DMSans",
	},
});
