import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Bell, ExternalLink, Settings2 } from "lucide-react-native";
import {
	Platform,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, CardContent } from "@/components/ui/card";
import { radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useSettings } from "@/lib/settings";

export default function NotificationsSettingsScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { settings, updateSettings } = useSettings();

	const handleToggleNotifications = async (value: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		await updateSettings({ notificationsEnabled: value });
	};

	const openSystemSettings = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		if (Platform.OS === "ios") {
			Linking.openSettings();
		} else {
			Linking.openSettings();
		}
	};

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					paddingBottom: insets.bottom + 16,
				},
			]}
		>
			<View style={styles.content}>
				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					Push Notifications
				</Text>
				<Card style={styles.card}>
					<CardContent style={styles.cardContent}>
						<View style={styles.row}>
							<View
								style={[
									styles.iconContainer,
									{ backgroundColor: colors.muted },
								]}
							>
								<Bell
									size={20}
									color={colors.mutedForeground}
									strokeWidth={2}
								/>
							</View>
							<View style={styles.rowContent}>
								<Text style={[styles.rowLabel, { color: colors.text }]}>
									Enable Notifications
								</Text>
								<Text
									style={[
										styles.rowDescription,
										{ color: colors.mutedForeground },
									]}
								>
									Receive updates about your saves and collections
								</Text>
							</View>
							<Switch
								value={settings.notificationsEnabled}
								onValueChange={handleToggleNotifications}
								trackColor={{
									false: colors.muted,
									true: colors.primary,
								}}
								thumbColor="#FFFFFF"
							/>
						</View>
					</CardContent>
				</Card>

				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					System Settings
				</Text>
				<Card style={styles.card}>
					<TouchableOpacity
						style={styles.systemButton}
						onPress={openSystemSettings}
						activeOpacity={0.7}
					>
						<View
							style={[styles.iconContainer, { backgroundColor: colors.muted }]}
						>
							<Settings2
								size={20}
								color={colors.mutedForeground}
								strokeWidth={2}
							/>
						</View>
						<View style={styles.rowContent}>
							<Text style={[styles.rowLabel, { color: colors.text }]}>
								Open System Settings
							</Text>
							<Text
								style={[
									styles.rowDescription,
									{ color: colors.mutedForeground },
								]}
							>
								Manage notification permissions at the system level
							</Text>
						</View>
						<ExternalLink size={18} color={colors.mutedForeground} />
					</TouchableOpacity>
				</Card>

				<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
					To fully enable notifications, you need to allow Backpocket to send
					notifications in your device's system settings.
				</Text>
			</View>
		</View>
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
		padding: 0,
		paddingTop: 0,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
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
	systemButton: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		gap: 14,
	},
	helpText: {
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 20,
		marginLeft: 4,
	},
});
