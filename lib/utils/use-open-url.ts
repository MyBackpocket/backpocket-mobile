/**
 * Hook for opening URLs with user preference awareness
 * Respects the user's setting for opening links in-app vs external browser
 */

import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import {
	openBrowserAsync,
	WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useCallback } from "react";
import { useSettings } from "@/lib/settings";

export function useOpenUrl() {
	const { settings } = useSettings();

	const openUrl = useCallback(
		async (url: string) => {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			if (settings.openLinksInApp) {
				try {
					await openBrowserAsync(url, {
						presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
					});
				} catch {
					// Fallback to external browser if in-app browser fails
					await Linking.openURL(url);
				}
			} else {
				await Linking.openURL(url);
			}
		},
		[settings.openLinksInApp],
	);

	return { openUrl };
}
