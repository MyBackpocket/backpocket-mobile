import { useUser } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Check, Copy, ExternalLink, Globe, Lock, Unlock } from "lucide-react-native";
import { useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, CardContent } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

export default function PublicSpaceSettingsScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { user } = useUser();

	const [isPublicEnabled, setIsPublicEnabled] = useState(true);
	const [copied, setCopied] = useState(false);

	// Generate public space URL (would come from API in production)
	const username = user?.username || user?.id?.slice(0, 8) || "user";
	const publicSpaceUrl = `https://backpocket.app/@${username}`;

	const handleTogglePublic = async (value: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setIsPublicEnabled(value);
		// In production, this would make an API call to update the setting
	};

	const handleCopyUrl = async () => {
		await Clipboard.setStringAsync(publicSpaceUrl);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleOpenPublicSpace = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Linking.openURL(publicSpaceUrl);
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={[
				styles.content,
				{ paddingBottom: insets.bottom + 16 },
			]}
		>
			{/* Public Space Toggle */}
			<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
				Visibility
			</Text>
			<Card style={styles.card}>
				<CardContent style={styles.cardContent}>
					<View style={styles.row}>
						<View
							style={[
								styles.iconContainer,
								{
									backgroundColor: isPublicEnabled
										? `${brandColors.mint}30`
										: colors.muted,
								},
							]}
						>
							{isPublicEnabled ? (
								<Unlock size={20} color={brandColors.mint} strokeWidth={2} />
							) : (
								<Lock size={20} color={colors.mutedForeground} strokeWidth={2} />
							)}
						</View>
						<View style={styles.rowContent}>
							<Text style={[styles.rowLabel, { color: colors.text }]}>
								Public Space
							</Text>
							<Text
								style={[styles.rowDescription, { color: colors.mutedForeground }]}
							>
								{isPublicEnabled
									? "Your public saves are visible to anyone"
									: "Your space is private and hidden"}
							</Text>
						</View>
						<Switch
							value={isPublicEnabled}
							onValueChange={handleTogglePublic}
							trackColor={{
								false: colors.muted,
								true: brandColors.mint,
							}}
							thumbColor="#FFFFFF"
						/>
					</View>
				</CardContent>
			</Card>

			{/* Public Space URL */}
			{isPublicEnabled && (
				<>
					<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
						Your Public Link
					</Text>
					<Card style={styles.card}>
						<CardContent style={styles.cardContent}>
							<View style={styles.urlContainer}>
								<View
									style={[styles.iconContainer, { backgroundColor: colors.muted }]}
								>
									<Globe
										size={20}
										color={colors.mutedForeground}
										strokeWidth={2}
									/>
								</View>
								<Text
									style={[styles.urlText, { color: colors.text }]}
									numberOfLines={1}
								>
									{publicSpaceUrl}
								</Text>
							</View>
							<View style={styles.urlActions}>
								<TouchableOpacity
									style={[
										styles.urlButton,
										{ backgroundColor: colors.muted, borderColor: colors.border },
									]}
									onPress={handleCopyUrl}
									activeOpacity={0.7}
								>
									{copied ? (
										<Check size={18} color={brandColors.mint} strokeWidth={2} />
									) : (
										<Copy
											size={18}
											color={colors.mutedForeground}
											strokeWidth={2}
										/>
									)}
									<Text
										style={[
											styles.urlButtonText,
											{ color: copied ? brandColors.mint : colors.text },
										]}
									>
										{copied ? "Copied!" : "Copy"}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.urlButton,
										{ backgroundColor: colors.primary },
									]}
									onPress={handleOpenPublicSpace}
									activeOpacity={0.7}
								>
									<ExternalLink size={18} color="#FFFFFF" strokeWidth={2} />
									<Text style={[styles.urlButtonText, { color: "#FFFFFF" }]}>
										Open
									</Text>
								</TouchableOpacity>
							</View>
						</CardContent>
					</Card>
				</>
			)}

			{/* Help Text */}
			<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
				{isPublicEnabled
					? "Share your public link with others to let them view your public saves and collections. Only saves marked as public will be visible."
					: "When disabled, no one can view your public space. Enable it to share your saves with others."}
			</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 8,
		marginLeft: 4,
	},
	card: {
		marginBottom: 20,
	},
	cardContent: {
		padding: 16,
		paddingTop: 16,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	rowContent: {
		flex: 1,
	},
	rowLabel: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 2,
	},
	rowDescription: {
		fontSize: 14,
		fontFamily: "DMSans",
		lineHeight: 20,
	},
	urlContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 16,
	},
	urlText: {
		flex: 1,
		fontSize: 15,
		fontFamily: "DMSans-Medium",
	},
	urlActions: {
		flexDirection: "row",
		gap: 10,
	},
	urlButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: "transparent",
	},
	urlButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	helpText: {
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 20,
		marginLeft: 4,
	},
});

