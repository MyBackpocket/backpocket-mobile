import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
	Bell,
	ChevronRight,
	ExternalLink,
	Globe,
	HelpCircle,
	LogOut,
	Moon,
	Shield,
	User,
} from "lucide-react-native";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";

export default function SettingsScreen() {
	const colors = useThemeColors();
	const router = useRouter();

	// Clerk hooks (only if configured)
	// biome-ignore lint/correctness/useHookAtTopLevel: Conditional hook based on Clerk config is intentional
	const auth = CLERK_PUBLISHABLE_KEY ? useAuth() : null;
	// biome-ignore lint/correctness/useHookAtTopLevel: Conditional hook based on Clerk config is intentional
	const userHook = CLERK_PUBLISHABLE_KEY ? useUser() : null;
	const user = userHook?.user;

	const handleSignOut = async () => {
		if (!auth?.signOut) return;

		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					await auth.signOut();
					router.replace("/(auth)/sign-in");
				},
			},
		]);
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={styles.content}
		>
			{/* Profile Section */}
			<Card style={styles.section}>
				<CardContent style={styles.profileContent}>
					<View
						style={[
							styles.avatar,
							{ backgroundColor: brandColors.denim.DEFAULT },
						]}
					>
						<Text style={styles.avatarText}>
							{user?.firstName?.[0] ||
								user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
								"?"}
						</Text>
					</View>
					<View style={styles.profileInfo}>
						<Text style={[styles.profileName, { color: colors.text }]}>
							{user?.firstName && user?.lastName
								? `${user.firstName} ${user.lastName}`
								: user?.firstName || "User"}
						</Text>
						<Text
							style={[styles.profileEmail, { color: colors.mutedForeground }]}
						>
							{user?.emailAddresses?.[0]?.emailAddress || "No email"}
						</Text>
					</View>
				</CardContent>
			</Card>

			{/* Settings Sections */}
			<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
				Account
			</Text>
			<Card style={styles.section}>
				<SettingsRow
					icon={User}
					label="Profile"
					onPress={() => {}}
					colors={colors}
				/>
				<SettingsRow
					icon={Globe}
					label="Public Space"
					subtitle="Manage your public page"
					onPress={() => {}}
					colors={colors}
				/>
			</Card>

			<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
				Preferences
			</Text>
			<Card style={styles.section}>
				<SettingsRow
					icon={Moon}
					label="Appearance"
					subtitle="System"
					onPress={() => {}}
					colors={colors}
				/>
				<SettingsRow
					icon={Bell}
					label="Notifications"
					onPress={() => {}}
					colors={colors}
				/>
			</Card>

			<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
				About
			</Text>
			<Card style={styles.section}>
				<SettingsRow
					icon={Shield}
					label="Privacy Policy"
					showExternal
					onPress={() => {}}
					colors={colors}
				/>
				<SettingsRow
					icon={HelpCircle}
					label="Help & Support"
					showExternal
					onPress={() => {}}
					colors={colors}
				/>
				<View style={styles.versionRow}>
					<Text
						style={[styles.versionLabel, { color: colors.mutedForeground }]}
					>
						Version
					</Text>
					<Text
						style={[styles.versionValue, { color: colors.mutedForeground }]}
					>
						1.0.0
					</Text>
				</View>
			</Card>

			{/* Sign Out */}
			<Button
				variant="outline"
				onPress={handleSignOut}
				style={styles.signOutButton}
			>
				<LogOut size={18} color={colors.destructive} />
				<Text style={[styles.signOutText, { color: colors.destructive }]}>
					Sign Out
				</Text>
			</Button>
		</ScrollView>
	);
}

interface SettingsRowProps {
	icon: React.ComponentType<{
		size: number;
		color: string;
		strokeWidth?: number;
	}>;
	label: string;
	subtitle?: string;
	showExternal?: boolean;
	onPress: () => void;
	colors: ReturnType<typeof useThemeColors>;
}

function SettingsRow({
	icon: Icon,
	label,
	subtitle,
	showExternal,
	onPress,
	colors,
}: SettingsRowProps) {
	return (
		<TouchableOpacity
			style={styles.settingsRow}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={[styles.settingsIcon, { backgroundColor: colors.muted }]}>
				<Icon size={18} color={colors.mutedForeground} strokeWidth={2} />
			</View>
			<View style={styles.settingsContent}>
				<Text style={[styles.settingsLabel, { color: colors.text }]}>
					{label}
				</Text>
				{subtitle && (
					<Text
						style={[styles.settingsSubtitle, { color: colors.mutedForeground }]}
					>
						{subtitle}
					</Text>
				)}
			</View>
			{showExternal ? (
				<ExternalLink size={18} color={colors.mutedForeground} />
			) : (
				<ChevronRight size={18} color={colors.mutedForeground} />
			)}
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	section: {
		marginBottom: 16,
	},
	profileContent: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		gap: 16,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		fontSize: 22,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		color: "#FFFFFF",
	},
	profileInfo: {
		flex: 1,
	},
	profileName: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 2,
	},
	profileEmail: {
		fontSize: 14,
		fontFamily: "DMSans",
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
	settingsRow: {
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(0,0,0,0.1)",
	},
	settingsIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	settingsContent: {
		flex: 1,
	},
	settingsLabel: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	settingsSubtitle: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginTop: 2,
	},
	versionRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 14,
	},
	versionLabel: {
		fontSize: 15,
		fontFamily: "DMSans",
	},
	versionValue: {
		fontSize: 15,
		fontFamily: "DMSans",
	},
	signOutButton: {
		marginTop: 8,
		marginBottom: 32,
		flexDirection: "row",
		gap: 8,
	},
	signOutText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
});
