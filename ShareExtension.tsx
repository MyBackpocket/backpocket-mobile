/**
 * iOS Share Extension Component
 *
 * This is the minimal UI shown when a user shares to Backpocket via the iOS share sheet.
 * It extracts the URL and opens the host app to complete the save.
 */

import { close, type InitialProps, openHostApp } from "expo-share-extension";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { brandColors } from "./constants/theme";

interface ShareExtensionProps extends InitialProps {}

/**
 * Extract a valid URL from the shared data
 */
function extractUrl(props: ShareExtensionProps): string | null {
	// Check for direct URL
	if (props.url) {
		return props.url;
	}

	// Check for URL in text content
	if (props.text) {
		// Try to find a URL in the text
		const urlMatch = props.text.match(/https?:\/\/[^\s]+/);
		if (urlMatch) {
			return urlMatch[0];
		}
	}

	return null;
}

export default function ShareExtension(props: ShareExtensionProps) {
	const [status, setStatus] = useState<"loading" | "opening" | "error">(
		"loading",
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		async function handleShare() {
			try {
				const url = extractUrl(props);

				if (!url) {
					setStatus("error");
					setErrorMessage("No valid URL found in shared content");
					// Close after a short delay so user can see the message
					setTimeout(() => close(), 2000);
					return;
				}

				setStatus("opening");

				// Open the host app with the share route
				// The URL is encoded to handle special characters
				const encodedUrl = encodeURIComponent(url);
				openHostApp(`share?url=${encodedUrl}`);

				// Close the share extension
				// Small delay to ensure the host app opens first
				setTimeout(() => close(), 500);
			} catch (error) {
				console.error("[ShareExtension] Error:", error);
				setStatus("error");
				setErrorMessage("Failed to save link");
				setTimeout(() => close(), 2000);
			}
		}

		handleShare();
	}, [props]);

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<View style={styles.header}>
					<Text style={styles.title}>Backpocket</Text>
				</View>

				{status === "loading" && (
					<>
						<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
						<Text style={styles.statusText}>Processing...</Text>
					</>
				)}

				{status === "opening" && (
					<>
						<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
						<Text style={styles.statusText}>Opening Backpocket...</Text>
					</>
				)}

				{status === "error" && (
					<Text style={styles.errorText}>{errorMessage}</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.4)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	card: {
		backgroundColor: "#F5F0E6", // cream
		borderRadius: 16,
		padding: 24,
		width: "100%",
		maxWidth: 320,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
	},
	header: {
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		color: "#3A3A3A", // charcoal
	},
	statusText: {
		marginTop: 12,
		fontSize: 15,
		color: "#5C7080", // muted foreground
	},
	errorText: {
		fontSize: 15,
		color: "#EF4444", // destructive
		textAlign: "center",
	},
});
