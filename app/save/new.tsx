/**
 * Add Save Screen
 * Create a new save manually with URL input
 */

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Link as LinkIcon } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 36;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useCreateSave } from "@/lib/api/saves";
import type { SaveVisibility } from "@/lib/api/types";

export default function NewSaveScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ url?: string }>();
	const colors = useThemeColors();

	const createSave = useCreateSave();

	const [url, setUrl] = useState(params.url || "");
	const [title, setTitle] = useState("");
	const [visibility, setVisibility] = useState<SaveVisibility>("private");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);

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
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to save link",
			);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	}, [url, title, visibility, tags, createSave, router, isValidUrl]);

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
							<ChevronLeft size={24} color={colors.text} />
						</TouchableOpacity>
					),
					headerRight: () => (
						<TouchableOpacity
							onPress={handleSave}
							disabled={createSave.isPending || !url.trim()}
							style={styles.headerButton}
						>
							<Check
								size={22}
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

			<ScrollView
				style={[styles.container, { backgroundColor: colors.background }]}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				{/* URL Input */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<View style={styles.inputGroup}>
							<View
								style={[styles.inputIcon, { backgroundColor: colors.muted }]}
							>
								<LinkIcon size={20} color={colors.mutedForeground} />
							</View>
							<Input
								placeholder="https://example.com/article"
								value={url}
								onChangeText={setUrl}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="url"
								returnKeyType="next"
								containerStyle={styles.urlInput}
							/>
						</View>
					</CardContent>
				</Card>

				{/* Title (optional) */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<Text style={[styles.label, { color: colors.text }]}>
							Title (optional)
						</Text>
						<Input
							placeholder="Custom title for this save"
							value={title}
							onChangeText={setTitle}
							containerStyle={styles.input}
						/>
						<Text style={[styles.hint, { color: colors.mutedForeground }]}>
							Leave empty to use the page title
						</Text>
					</CardContent>
				</Card>

				{/* Visibility */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<Text style={[styles.label, { color: colors.text }]}>
							Visibility
						</Text>
						<View style={styles.visibilityOptions}>
							{(["private", "public", "unlisted"] as SaveVisibility[]).map(
								(v) => (
									<TouchableOpacity
										key={v}
										style={[
											styles.visibilityOption,
											{ borderColor: colors.border },
											visibility === v && {
												borderColor: brandColors.rust.DEFAULT,
												backgroundColor: `${brandColors.rust.DEFAULT}10`,
											},
										]}
										onPress={() => setVisibility(v)}
									>
										<Text
											style={[
												styles.visibilityText,
												{
													color:
														visibility === v
															? brandColors.rust.DEFAULT
															: colors.text,
												},
											]}
										>
											{v.charAt(0).toUpperCase() + v.slice(1)}
										</Text>
									</TouchableOpacity>
								),
							)}
						</View>
					</CardContent>
				</Card>

				{/* Tags */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<Text style={[styles.label, { color: colors.text }]}>Tags</Text>
						<View style={styles.tagInputRow}>
							<Input
								placeholder="Add a tag"
								value={tagInput}
								onChangeText={setTagInput}
								onSubmitEditing={handleAddTag}
								returnKeyType="done"
								autoCapitalize="none"
								containerStyle={styles.tagInput}
							/>
							<Button
								size="sm"
								onPress={handleAddTag}
								disabled={!tagInput.trim()}
							>
								Add
							</Button>
						</View>
						{tags.length > 0 && (
							<View style={styles.tags}>
								{tags.map((tag) => (
									<TouchableOpacity
										key={tag}
										style={[
											styles.tag,
											{ backgroundColor: `${brandColors.denim.DEFAULT}15` },
										]}
										onPress={() => handleRemoveTag(tag)}
									>
										<Text
											style={[
												styles.tagText,
												{ color: brandColors.denim.deep },
											]}
										>
											{tag}
										</Text>
										<Text
											style={[
												styles.tagRemove,
												{ color: brandColors.denim.deep },
											]}
										>
											×
										</Text>
									</TouchableOpacity>
								))}
							</View>
						)}
					</CardContent>
				</Card>

				{/* Save Button */}
				<Button
					onPress={handleSave}
					loading={createSave.isPending}
					disabled={createSave.isPending || !url.trim()}
					style={styles.saveButton}
				>
					Save Link
				</Button>
			</ScrollView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	headerButton: {
		width: HEADER_BUTTON_SIZE,
		height: HEADER_BUTTON_SIZE,
		borderRadius: HEADER_BUTTON_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	section: {
		marginBottom: 16,
	},
	sectionContent: {
		padding: 16,
	},
	inputGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	inputIcon: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	urlInput: {
		flex: 1,
	},
	label: {
		fontSize: 15,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		marginBottom: 10,
	},
	input: {
		marginBottom: 4,
	},
	hint: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginTop: 4,
	},
	visibilityOptions: {
		flexDirection: "row",
		gap: 10,
	},
	visibilityOption: {
		flex: 1,
		paddingVertical: 12,
		borderWidth: 1,
		borderRadius: radii.md,
		alignItems: "center",
	},
	visibilityText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	tagInputRow: {
		flexDirection: "row",
		gap: 10,
		alignItems: "flex-end",
	},
	tagInput: {
		flex: 1,
	},
	tags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 12,
	},
	tag: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radii.sm,
		gap: 4,
	},
	tagText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	tagRemove: {
		fontSize: 18,
		fontWeight: "500",
		marginLeft: 2,
	},
	saveButton: {
		marginTop: 8,
	},
});
