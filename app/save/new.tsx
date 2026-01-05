/**
 * Add Save Screen
 * Create a new save manually with URL input
 */

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
	Check,
	ChevronLeft,
	Eye,
	EyeOff,
	Link as LinkIcon,
	Sparkles,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 40;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useTheme } from "@/lib/theme/provider";
import { getDuplicateSaveFromError, useCreateSave } from "@/lib/api/saves";
import { useMySpace } from "@/lib/api/space";
import type { DuplicateSaveInfo, SaveVisibility } from "@/lib/api/types";

// Amber text colors optimized for readability
const amberTextColors = {
	light: "#9A6B2F", // Darker amber/gold for light backgrounds
	dark: brandColors.amber, // Regular amber for dark backgrounds
};

export default function NewSaveScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ url?: string }>();
	const colors = useThemeColors();
	const { colorScheme } = useTheme();

	// Get user's space settings for default visibility
	const { data: space } = useMySpace();

	const createSave = useCreateSave();

	const [url, setUrl] = useState(params.url || "");
	const [title, setTitle] = useState("");
	// Use space's default visibility or fall back to "public"
	const [visibility, setVisibility] = useState<SaveVisibility>(
		space?.defaultSaveVisibility ?? "public",
	);
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);

	// Update visibility when space data loads (if user hasn't interacted yet)
	const userChangedVisibility = useRef(false);
	useEffect(() => {
		if (space?.defaultSaveVisibility && !userChangedVisibility.current) {
			setVisibility(space.defaultSaveVisibility);
		}
	}, [space?.defaultSaveVisibility]);

	const isValidUrl = useCallback((text: string): boolean => {
		try {
			new URL(text);
			return text.startsWith("http://") || text.startsWith("https://");
		} catch {
			return false;
		}
	}, []);

	const truncateUrl = useCallback((text: string, maxLength = 50): string => {
		if (text.length <= maxLength) return text;
		return `${text.substring(0, maxLength)}...`;
	}, []);

	// Check clipboard for URL on mount
	useEffect(() => {
		async function checkClipboard() {
			if (url) return; // Don't override if we already have a URL

			try {
				const text = await Clipboard.getStringAsync();
				if (text && isValidUrl(text)) {
					Alert.alert(
						"Paste from Clipboard?",
						`Found a URL in your clipboard:\n\n${truncateUrl(text)}`,
						[
							{ text: "No", style: "cancel" },
							{ text: "Paste", onPress: () => setUrl(text) },
						],
					);
				}
			} catch {
				// Ignore clipboard errors
			}
		}
		checkClipboard();
	}, [url, isValidUrl, truncateUrl]);

	const handleAddTag = useCallback(() => {
		const trimmed = tagInput.trim().toLowerCase();
		if (trimmed && !tags.includes(trimmed)) {
			setTags([...tags, trimmed]);
			setTagInput("");
		}
	}, [tagInput, tags]);

	const handleRemoveTag = useCallback(
		(tagToRemove: string) => {
			setTags(tags.filter((t) => t !== tagToRemove));
		},
		[tags],
	);

	/**
	 * Format relative time for duplicate alert
	 */
	const formatRelativeTime = useCallback((dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSecs = Math.floor(diffMs / 1000);
		const diffMins = Math.floor(diffSecs / 60);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSecs < 60) return "just now";
		if (diffMins < 60)
			return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
		if (diffHours < 24)
			return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
		if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
		});
	}, []);

	/**
	 * Show duplicate save alert
	 */
	const showDuplicateAlert = useCallback(
		(existingSave: DuplicateSaveInfo) => {
			const title = existingSave.title || existingSave.url;
			const savedTimeAgo = formatRelativeTime(existingSave.savedAt);

			Alert.alert(
				"Already Saved",
				`You saved this link ${savedTimeAgo}:\n\n"${title.length > 60 ? `${title.substring(0, 60)}...` : title}"`,
				[
					{
						text: "View Saves",
						onPress: () => {
							router.replace("/(tabs)/saves");
						},
					},
					{ text: "OK", style: "cancel" },
				],
			);
		},
		[formatRelativeTime, router],
	);

	const handleSave = useCallback(async () => {
		if (!url.trim()) {
			Alert.alert("Error", "Please enter a URL");
			return;
		}

		if (!isValidUrl(url.trim())) {
			Alert.alert(
				"Error",
				"Please enter a valid URL (starting with http:// or https://)",
			);
			return;
		}

		try {
			await createSave.mutateAsync({
				url: url.trim(),
				title: title.trim() || undefined,
				visibility,
				tagNames: tags.length > 0 ? tags : undefined,
			});

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.back();
		} catch (error) {
			// Check if this is a duplicate save error
			const existingSave = getDuplicateSaveFromError(error);
			if (existingSave) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
				showDuplicateAlert(existingSave);
				return;
			}

			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save link",
			);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	}, [
		url,
		title,
		visibility,
		tags,
		createSave,
		router,
		isValidUrl,
		showDuplicateAlert,
	]);

	return (
		<>
			<Stack.Screen
				options={{
					title: "Add Save",
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.headerButton}
						>
							<ChevronLeft size={22} color={colors.text} />
						</TouchableOpacity>
					),
					headerRight: () => (
						<TouchableOpacity
							onPress={handleSave}
							disabled={createSave.isPending || !url.trim()}
							style={styles.headerButton}
						>
							<Check
								size={20}
								color={
									createSave.isPending || !url.trim()
										? colors.mutedForeground
										: brandColors.rust.DEFAULT
								}
							/>
						</TouchableOpacity>
					),
				}}
			/>

			<KeyboardAvoidingView
				style={[styles.container, { backgroundColor: colors.background }]}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
			>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
				>
					{/* URL Input */}
					<Card style={styles.urlCard}>
						<CardContent style={styles.urlCardContent}>
							<View style={styles.urlInputGroup}>
								<View
									style={[styles.urlIcon, { backgroundColor: colors.muted }]}
								>
									<LinkIcon size={18} color={colors.mutedForeground} />
								</View>
								<Input
									placeholder="https://example.com/article"
									value={url}
									onChangeText={setUrl}
									autoCapitalize="none"
									autoCorrect={false}
									keyboardType="url"
									returnKeyType="next"
									containerStyle={styles.urlInputContainer}
								/>
							</View>
						</CardContent>
					</Card>

					{/* Auto-processing info banner */}
					<View
						style={[
							styles.infoBanner,
							{
								backgroundColor:
									colorScheme === "dark"
										? `${brandColors.amber}15`
										: `${brandColors.amber}20`,
							},
						]}
					>
						<Sparkles
							size={16}
							color={brandColors.amber}
							style={styles.infoBannerIcon}
						/>
						<Text
							style={[
								styles.infoBannerText,
								{ color: amberTextColors[colorScheme] },
							]}
						>
							We'll automatically fetch the page title, description, preview
							image, and article content for reader mode.
						</Text>
					</View>

					{/* Title (optional) */}
					<Card style={styles.section}>
						<CardContent style={styles.sectionContent}>
							<Text style={[styles.sectionLabel, { color: colors.text }]}>
								Title (optional)
							</Text>
							<Input
								placeholder="Custom title for this save"
								value={title}
								onChangeText={setTitle}
							/>
							<Text style={[styles.hint, { color: colors.mutedForeground }]}>
								Override the auto-fetched title, or leave empty to use what we
								find
							</Text>
						</CardContent>
					</Card>

					{/* Visibility */}
					<Card style={styles.section}>
						<CardContent style={styles.sectionContent}>
							<Text style={[styles.sectionLabel, { color: colors.text }]}>
								Visibility
							</Text>
							<View style={styles.visibilityOptions}>
								{(
									[
										{
											value: "private",
											label: "Private",
											icon: EyeOff,
											hint: "Only you can see this",
										},
										{
											value: "public",
											label: "Public",
											icon: Eye,
											hint: "Visible on your public space",
										},
									] as const
								).map((option) => {
									const isSelected = visibility === option.value;
									const Icon = option.icon;
									return (
										<Pressable
											key={option.value}
											style={[
												styles.visibilityOption,
												{
													borderColor: isSelected
														? brandColors.amber
														: colors.border,
													backgroundColor: isSelected
														? brandColors.amber
														: colors.muted,
												},
											]}
											onPress={() => {
												Haptics.selectionAsync();
												userChangedVisibility.current = true;
												setVisibility(option.value);
											}}
										>
											<Icon
												size={16}
												color={
													isSelected ? "#141D22" : colors.mutedForeground
												}
											/>
											<Text
												style={[
													styles.visibilityText,
													{
														color: isSelected ? "#141D22" : colors.text,
													},
												]}
											>
												{option.label}
											</Text>
											{isSelected && (
												<Check
													size={14}
													color="#141D22"
													style={{ marginLeft: 2 }}
												/>
											)}
										</Pressable>
									);
								})}
							</View>
							<Text style={[styles.hint, { color: colors.mutedForeground }]}>
								{visibility === "private"
									? "Only you can see this"
									: "Visible on your public space"}
							</Text>
						</CardContent>
					</Card>

					{/* Tags */}
					<Card style={styles.section}>
						<CardContent style={styles.sectionContent}>
							<Text style={[styles.sectionLabel, { color: colors.text }]}>
								Tags
							</Text>
							<View style={styles.tagInputRow}>
								<Input
									placeholder="Add a tag"
									value={tagInput}
									onChangeText={setTagInput}
									onSubmitEditing={handleAddTag}
									returnKeyType="done"
									autoCapitalize="none"
									containerStyle={styles.tagInputContainer}
								/>
								<Button
									size="sm"
									onPress={handleAddTag}
									disabled={!tagInput.trim()}
									style={styles.addTagButton}
								>
									Add
								</Button>
							</View>
							{tags.length > 0 && (
								<View style={styles.tagsContainer}>
									{tags.map((tag) => (
										<TouchableOpacity
											key={tag}
											style={[
												styles.tag,
												{ backgroundColor: `${brandColors.denim.DEFAULT}18` },
											]}
											onPress={() => handleRemoveTag(tag)}
											activeOpacity={0.7}
										>
											<Text
												style={[
													styles.tagText,
													{ color: brandColors.denim.deep },
												]}
											>
												{tag}
											</Text>
											<X size={14} color={brandColors.denim.deep} />
										</TouchableOpacity>
									))}
								</View>
							)}
							<Text style={[styles.hint, { color: colors.mutedForeground }]}>
								New tags are created automatically
							</Text>
						</CardContent>
					</Card>

					{/* Save Button */}
					<View style={styles.buttonContainer}>
						<Button
							onPress={handleSave}
							loading={createSave.isPending}
							disabled={createSave.isPending || !url.trim()}
							style={styles.saveButton}
						>
							Save Link
						</Button>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 20,
		paddingTop: 24,
		paddingBottom: 40,
	},
	headerButton: {
		width: HEADER_BUTTON_SIZE,
		height: HEADER_BUTTON_SIZE,
		borderRadius: HEADER_BUTTON_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	// URL Card - special styling for the primary input
	urlCard: {
		marginBottom: 16,
	},
	urlCardContent: {
		padding: 16,
		paddingTop: 16,
	},
	urlInputGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	urlIcon: {
		width: 48,
		height: 48,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	urlInputContainer: {
		flex: 1,
	},
	// Info banner
	infoBanner: {
		flexDirection: "row",
		alignItems: "flex-start",
		padding: 14,
		borderRadius: radii.md,
		marginBottom: 20,
	},
	infoBannerIcon: {
		marginRight: 10,
		marginTop: 2,
	},
	infoBannerText: {
		flex: 1,
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 19,
	},
	// Regular sections
	section: {
		marginBottom: 20,
	},
	sectionContent: {
		padding: 20,
		paddingTop: 20,
	},
	sectionLabel: {
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		marginBottom: 14,
	},
	hint: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginTop: 10,
		lineHeight: 18,
	},
	// Visibility options
	visibilityOptions: {
		flexDirection: "row",
		gap: 10,
	},
	visibilityOption: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderWidth: 1.5,
		borderRadius: radii.md,
	},
	visibilityText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	// Tags
	tagInputRow: {
		flexDirection: "row",
		gap: 12,
		alignItems: "flex-end",
	},
	tagInputContainer: {
		flex: 1,
	},
	addTagButton: {
		marginBottom: 1,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginTop: 16,
	},
	tag: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 14,
		paddingRight: 10,
		paddingVertical: 8,
		borderRadius: radii.full,
		gap: 6,
	},
	tagText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	// Save button
	buttonContainer: {
		marginTop: 12,
	},
	saveButton: {
		height: 52,
	},
});
