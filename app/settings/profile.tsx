import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { Mail, Save, User } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

export default function ProfileSettingsScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { user, isLoaded } = useUser();

	const [firstName, setFirstName] = useState(user?.firstName || "");
	const [lastName, setLastName] = useState(user?.lastName || "");
	const [isSaving, setIsSaving] = useState(false);

	const hasChanges =
		firstName !== (user?.firstName || "") ||
		lastName !== (user?.lastName || "");

	const handleSave = async () => {
		if (!user || !hasChanges) return;

		setIsSaving(true);
		try {
			await user.update({
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			Alert.alert("Success", "Your profile has been updated.");
		} catch (error) {
			console.error("[profile] Failed to update:", error);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			Alert.alert("Error", "Failed to update profile. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	if (!isLoaded) {
		return (
			<View
				style={[
					styles.container,
					styles.loadingContainer,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	const userInitial =
		user?.firstName?.[0] ||
		user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
		"?";

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 16 },
				]}
				keyboardShouldPersistTaps="handled"
			>
				{/* Profile Picture Section */}
				<View style={styles.avatarSection}>
					{user?.imageUrl ? (
						<Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
					) : (
						<View
							style={[
								styles.avatarPlaceholder,
								{ backgroundColor: brandColors.denim.DEFAULT },
							]}
						>
							<Text style={styles.avatarText}>{userInitial}</Text>
						</View>
					)}
					<Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
						Profile picture is managed through your account provider
					</Text>
				</View>

				{/* Form Fields */}
				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					Personal Information
				</Text>
				<Card style={styles.card}>
					<CardContent style={styles.cardContent}>
						<View style={styles.inputGroup}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								First Name
							</Text>
							<View
								style={[
									styles.inputContainer,
									{
										backgroundColor: colors.muted,
										borderColor: colors.border,
									},
								]}
							>
								<User size={18} color={colors.mutedForeground} />
								<TextInput
									style={[styles.input, { color: colors.text }]}
									value={firstName}
									onChangeText={setFirstName}
									placeholder="Enter first name"
									placeholderTextColor={colors.mutedForeground}
									autoCapitalize="words"
									autoCorrect={false}
								/>
							</View>
						</View>

						<View style={styles.inputGroup}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								Last Name
							</Text>
							<View
								style={[
									styles.inputContainer,
									{
										backgroundColor: colors.muted,
										borderColor: colors.border,
									},
								]}
							>
								<User size={18} color={colors.mutedForeground} />
								<TextInput
									style={[styles.input, { color: colors.text }]}
									value={lastName}
									onChangeText={setLastName}
									placeholder="Enter last name"
									placeholderTextColor={colors.mutedForeground}
									autoCapitalize="words"
									autoCorrect={false}
								/>
							</View>
						</View>

						<View style={styles.inputGroup}>
							<Text style={[styles.inputLabel, { color: colors.text }]}>
								Email
							</Text>
							<View
								style={[
									styles.inputContainer,
									styles.inputDisabled,
									{
										backgroundColor: colors.muted,
										borderColor: colors.border,
									},
								]}
							>
								<Mail size={18} color={colors.mutedForeground} />
								<Text
									style={[
										styles.inputDisabledText,
										{ color: colors.mutedForeground },
									]}
								>
									{user?.emailAddresses?.[0]?.emailAddress || "No email"}
								</Text>
							</View>
							<Text
								style={[styles.inputHint, { color: colors.mutedForeground }]}
							>
								Email address cannot be changed from the app
							</Text>
						</View>
					</CardContent>
				</Card>

				{/* Save Button */}
				<Button
					onPress={handleSave}
					disabled={!hasChanges || isSaving}
					style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
				>
					{isSaving ? (
						<ActivityIndicator size="small" color="#FFFFFF" />
					) : (
						<>
							<Save size={18} color="#FFFFFF" strokeWidth={2} />
							<Text style={styles.saveButtonText}>Save Changes</Text>
						</>
					)}
				</Button>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	loadingContainer: {
		alignItems: "center",
		justifyContent: "center",
	},
	content: {
		padding: 16,
	},
	avatarSection: {
		alignItems: "center",
		marginBottom: 32,
		paddingTop: 8,
	},
	avatarImage: {
		width: 96,
		height: 96,
		borderRadius: 48,
		marginBottom: 12,
	},
	avatarPlaceholder: {
		width: 96,
		height: 96,
		borderRadius: 48,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	avatarText: {
		fontSize: 36,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		color: "#FFFFFF",
	},
	avatarHint: {
		fontSize: 13,
		fontFamily: "DMSans",
		textAlign: "center",
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
		marginBottom: 24,
	},
	cardContent: {
		padding: 16,
		paddingTop: 16,
		gap: 20,
	},
	inputGroup: {
		gap: 8,
	},
	inputLabel: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: radii.md,
		borderWidth: 1,
		paddingHorizontal: 14,
		paddingVertical: 12,
		gap: 10,
	},
	input: {
		flex: 1,
		fontSize: 16,
		fontFamily: "DMSans",
		padding: 0,
	},
	inputDisabled: {
		opacity: 0.7,
	},
	inputDisabledText: {
		flex: 1,
		fontSize: 16,
		fontFamily: "DMSans",
	},
	inputHint: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginLeft: 2,
	},
	saveButton: {
		flexDirection: "row",
		gap: 8,
	},
	saveButtonDisabled: {
		opacity: 0.5,
	},
	saveButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
});
