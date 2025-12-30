/**
 * Share Handler Screen
 *
 * This screen handles incoming share intents from both iOS and Android.
 * It auto-saves the shared URL immediately and shows a confirmation.
 */

import { useAuth } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntent } from "expo-share-intent";
import { Check, ExternalLink, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoIcon } from "@/components/ui/logo";
import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useCreateSave } from "@/lib/api/saves";

type ShareStatus = "loading" | "saving" | "success" | "error" | "auth_required";

export default function ShareScreen() {
	const router = useRouter();
	const colors = useThemeColors();
	const params = useLocalSearchParams<{ url?: string }>();

	// Always call useAuth hook (React rules of hooks)
	const auth = useAuth();
	const isSignedIn = auth.isSignedIn ?? false;
	const isLoaded = auth.isLoaded;

	// Get share intent data (for Android/iOS share intent flow)
	const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

	// Create save mutation
	const createSave = useCreateSave();

	const [status, setStatus] = useState<ShareStatus>("loading");
	const [savedUrl, setSavedUrl] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	/**
	 * Extract URL from params or share intent
	 */
	const getSharedUrl = useCallback((): string | null => {
		// Check URL params first (from iOS share extension openHostApp)
		if (params.url) {
			try {
				return decodeURIComponent(params.url);
			} catch {
				return params.url;
			}
		}

		// Check share intent (from Android)
		if (hasShareIntent && shareIntent) {
			// URL directly
			if (shareIntent.webUrl) {
				return shareIntent.webUrl;
			}
			// Check text for URL
			if (shareIntent.text) {
				const urlMatch = shareIntent.text.match(/https?:\/\/[^\s]+/);
				if (urlMatch) {
					return urlMatch[0];
				}
			}
		}

		return null;
	}, [params.url, hasShareIntent, shareIntent]);

	/**
	 * Save the URL
	 */
	const saveUrl = useCallback(
		async (url: string) => {
			setStatus("saving");
			setSavedUrl(url);

			try {
				await createSave.mutateAsync({ url });
				setStatus("success");

				// Haptic feedback on success
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

				// Reset share intent after successful save
				if (hasShareIntent) {
					resetShareIntent();
				}
			} catch (error) {
				console.error("[share] Save failed:", error);
				setStatus("error");
				setErrorMessage(
					error instanceof Error ? error.message : "Failed to save link",
				);

				// Haptic feedback on error
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			}
		},
		[createSave, hasShareIntent, resetShareIntent],
	);

	/**
	 * Handle the share flow
	 */
	useEffect(() => {
		// Wait for auth to load
		if (!isLoaded) {
			return;
		}

		// Check if user is signed in
		if (!isSignedIn) {
			setStatus("auth_required");
			return;
		}

		// Get the URL to save
		const url = getSharedUrl();

		if (!url) {
			setStatus("error");
			setErrorMessage("No valid URL found");
			return;
		}

		// Auto-save immediately
		saveUrl(url);
	}, [isLoaded, isSignedIn, getSharedUrl, saveUrl]);

	/**
	 * Handle close
	 */
	const handleClose = useCallback(() => {
		if (hasShareIntent) {
			resetShareIntent();
		}
		router.back();
	}, [router, hasShareIntent, resetShareIntent]);

	/**
	 * Navigate to sign in
	 */
	const handleSignIn = useCallback(() => {
		const url = getSharedUrl();
		// Store URL in params so we can resume after sign in
		router.push({
			pathname: "/(auth)/sign-in",
			params: url ? { returnUrl: `/share?url=${encodeURIComponent(url)}` } : {},
		});
	}, [router, getSharedUrl]);

	/**
	 * View saved item
	 */
	const handleViewSave = useCallback(() => {
		// Navigate to saves list for now
		router.replace("/(tabs)/saves");
	}, [router]);

	/**
	 * Retry save
	 */
	const handleRetry = useCallback(() => {
		const url = getSharedUrl();
		if (url) {
			saveUrl(url);
		}
	}, [getSharedUrl, saveUrl]);

	return (
		<View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
			<Card style={styles.card}>
				<CardContent style={styles.content}>
					{/* Header */}
					<View style={styles.header}>
						<LogoIcon size="md" />
						<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
							<X size={24} color={colors.mutedForeground} />
						</TouchableOpacity>
					</View>

					{/* Status Content */}
					{status === "loading" && (
						<View style={styles.statusContainer}>
							<ActivityIndicator
								size="large"
								color={brandColors.rust.DEFAULT}
							/>
							<Text style={[styles.statusText, { color: colors.text }]}>
								Processing...
							</Text>
						</View>
					)}

					{status === "saving" && (
						<View style={styles.statusContainer}>
							<ActivityIndicator
								size="large"
								color={brandColors.rust.DEFAULT}
							/>
							<Text style={[styles.statusText, { color: colors.text }]}>
								Saving to Backpocket...
							</Text>
							{savedUrl && (
								<Text
									style={[styles.urlText, { color: colors.mutedForeground }]}
									numberOfLines={2}
								>
									{savedUrl}
								</Text>
							)}
						</View>
					)}

					{status === "success" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.successIcon,
									{ backgroundColor: brandColors.mint },
								]}
							>
								<Check size={32} color="#FFFFFF" strokeWidth={3} />
							</View>
							<Text style={[styles.statusText, { color: colors.text }]}>
								Saved!
							</Text>
							{savedUrl && (
								<Text
									style={[styles.urlText, { color: colors.mutedForeground }]}
									numberOfLines={2}
								>
									{savedUrl}
								</Text>
							)}
							<View style={styles.actions}>
								<Button onPress={handleViewSave} style={styles.actionButton}>
									<ExternalLink size={18} color="#FFFFFF" />
									<Text style={styles.actionButtonText}>View Saves</Text>
								</Button>
								<Button
									variant="outline"
									onPress={handleClose}
									style={styles.actionButton}
								>
									Done
								</Button>
							</View>
						</View>
					)}

					{status === "error" && (
						<View style={styles.statusContainer}>
							<View
								style={[
									styles.errorIcon,
									{ backgroundColor: colors.destructive },
								]}
							>
								<X size={32} color="#FFFFFF" strokeWidth={3} />
							</View>
							<Text style={[styles.statusText, { color: colors.text }]}>
								Something went wrong
							</Text>
							<Text style={[styles.errorText, { color: colors.destructive }]}>
								{errorMessage}
							</Text>
							<View style={styles.actions}>
								<Button onPress={handleRetry} style={styles.actionButton}>
									Try Again
								</Button>
								<Button
									variant="outline"
									onPress={handleClose}
									style={styles.actionButton}
								>
									Cancel
								</Button>
							</View>
						</View>
					)}

					{status === "auth_required" && (
						<View style={styles.statusContainer}>
							<Text style={[styles.statusText, { color: colors.text }]}>
								Sign in required
							</Text>
							<Text style={[styles.subText, { color: colors.mutedForeground }]}>
								Please sign in to save links to your Backpocket.
							</Text>
							<View style={styles.actions}>
								<Button onPress={handleSignIn} style={styles.actionButton}>
									Sign In
								</Button>
								<Button
									variant="outline"
									onPress={handleClose}
									style={styles.actionButton}
								>
									Cancel
								</Button>
							</View>
						</View>
					)}
				</CardContent>
			</Card>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	card: {
		width: "100%",
		maxWidth: 360,
	},
	content: {
		padding: 24,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 24,
	},
	closeButton: {
		padding: 4,
	},
	statusContainer: {
		alignItems: "center",
		gap: 12,
	},
	statusText: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		textAlign: "center",
	},
	subText: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 20,
	},
	urlText: {
		fontSize: 13,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 18,
		marginTop: 4,
	},
	errorText: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
	},
	successIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	errorIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	actions: {
		width: "100%",
		gap: 12,
		marginTop: 16,
	},
	actionButton: {
		flexDirection: "row",
		gap: 8,
	},
	actionButtonText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
});
