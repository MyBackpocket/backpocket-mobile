/**
 * New Collection Screen
 * Create a new collection with name, description, visibility, and optional initial saves
 */

import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import {
	Check,
	ChevronLeft,
	Eye,
	EyeOff,
	FolderOpen,
	Plus,
	Tag as TagIcon,
	X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 40;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useCreateCollection } from "@/lib/api/collections";
import { useListSaves } from "@/lib/api/saves";
import { useListTags } from "@/lib/api/tags";
import type { CollectionVisibility } from "@/lib/api/types";

export default function NewCollectionScreen() {
	const router = useRouter();
	const colors = useThemeColors();

	const createCollection = useCreateCollection();
	const { data: existingTags = [] } = useListTags();

	// Form state
	const [name, setName] = useState("");
	const [visibility, setVisibility] = useState<CollectionVisibility>("private");
	const [defaultTags, setDefaultTags] = useState<string[]>([]);
	const [newTagInput, setNewTagInput] = useState("");
	const [selectedSaveIds, setSelectedSaveIds] = useState<string[]>([]);
	const [showSaveSelector, setShowSaveSelector] = useState(false);

	// Fetch user's saves for selection
	const { data: savesData } = useListSaves({ limit: 50 });
	const saves = savesData?.pages.flatMap((page) => page.items) ?? [];

	// Tag suggestions (existing tags not already added)
	const tagSuggestions = useMemo(() => {
		const lowerDefaultTags = defaultTags.map((t) => t.toLowerCase());
		return existingTags
			.filter((t) => !lowerDefaultTags.includes(t.name.toLowerCase()))
			.slice(0, 5);
	}, [existingTags, defaultTags]);

	const handleAddTag = (tagName: string) => {
		const trimmed = tagName.trim().toLowerCase();
		if (trimmed && !defaultTags.map((t) => t.toLowerCase()).includes(trimmed)) {
			setDefaultTags([...defaultTags, trimmed]);
		}
		setNewTagInput("");
	};

	const handleRemoveTag = (tagName: string) => {
		setDefaultTags(
			defaultTags.filter((t) => t.toLowerCase() !== tagName.toLowerCase()),
		);
	};

	const toggleSaveSelection = useCallback((saveId: string) => {
		setSelectedSaveIds((prev) =>
			prev.includes(saveId)
				? prev.filter((id) => id !== saveId)
				: [...prev, saveId],
		);
	}, []);

	const handleCreate = useCallback(async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			Alert.alert("Error", "Please enter a collection name");
			return;
		}

		try {
			const newCollection = await createCollection.mutateAsync({
				name: trimmedName,
				visibility,
				defaultTags: defaultTags.length > 0 ? defaultTags : undefined,
			});

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			// Navigate to the new collection's detail view
			router.replace(`/collection/${newCollection.id}`);
		} catch (error) {
			Alert.alert(
				"Error",
				error instanceof Error ? error.message : "Failed to create collection",
			);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	}, [name, visibility, createCollection, router, defaultTags]);

	const canCreate = name.trim().length > 0;

	return (
		<>
			<Stack.Screen
				options={{
					title: "New Collection",
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
							onPress={handleCreate}
							disabled={createCollection.isPending || !canCreate}
							style={styles.headerButton}
						>
							<Check
								size={20}
								color={
									createCollection.isPending || !canCreate
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
					{/* Collection Icon & Name */}
					<Card style={styles.nameCard}>
						<CardContent style={styles.nameCardContent}>
							<View style={styles.nameInputGroup}>
								<View
									style={[
										styles.iconPreview,
										{ backgroundColor: colors.muted },
									]}
								>
									<FolderOpen size={24} color={brandColors.amber} />
								</View>
								<Input
									placeholder="Collection name"
									value={name}
									onChangeText={setName}
									autoCapitalize="words"
									autoCorrect={false}
									returnKeyType="done"
									containerStyle={styles.nameInputContainer}
									style={styles.nameInput}
								/>
							</View>
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
											hint: "Only you can see saves in this collection",
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
												setVisibility(option.value);
											}}
										>
											<Icon
												size={16}
												color={isSelected ? "#141D22" : colors.mutedForeground}
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
									? "Only you can see saves in this collection"
									: "Public saves in this collection will be visible on your public space"}
							</Text>
						</CardContent>
					</Card>

					{/* Default Tags */}
					<Card style={styles.section}>
						<CardContent style={styles.sectionContent}>
							<View style={styles.sectionLabelRow}>
								<TagIcon size={16} color={colors.mutedForeground} />
								<Text
									style={[
										styles.sectionLabel,
										{ color: colors.text, marginBottom: 0 },
									]}
								>
									Default Tags
								</Text>
							</View>

							{/* Current default tags */}
							{defaultTags.length > 0 && (
								<View style={styles.defaultTagsRow}>
									{defaultTags.map((tagName) => (
										<View
											key={tagName}
											style={[
												styles.defaultTagChip,
												{ backgroundColor: `${brandColors.amber}20` },
											]}
										>
											<Text
												style={[
													styles.defaultTagText,
													{ color: brandColors.amber },
												]}
											>
												{tagName}
											</Text>
											<TouchableOpacity
												onPress={() => handleRemoveTag(tagName)}
												hitSlop={8}
											>
												<X size={14} color={brandColors.amber} />
											</TouchableOpacity>
										</View>
									))}
								</View>
							)}

							{/* Add tag input */}
							<View style={styles.addTagRow}>
								<TextInput
									value={newTagInput}
									onChangeText={setNewTagInput}
									placeholder="Add a default tag..."
									placeholderTextColor={colors.mutedForeground}
									onSubmitEditing={() => handleAddTag(newTagInput)}
									returnKeyType="done"
									style={[
										styles.addTagInput,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
											color: colors.text,
										},
									]}
								/>
								<TouchableOpacity
									onPress={() => handleAddTag(newTagInput)}
									disabled={!newTagInput.trim()}
									style={[
										styles.addTagButton,
										{
											backgroundColor: newTagInput.trim()
												? brandColors.amber
												: colors.muted,
										},
									]}
								>
									<Plus
										size={20}
										color={
											newTagInput.trim() ? "#141D22" : colors.mutedForeground
										}
									/>
								</TouchableOpacity>
							</View>

							{/* Tag suggestions */}
							{tagSuggestions.length > 0 && (
								<View style={styles.tagSuggestions}>
									<Text
										style={[
											styles.suggestionLabel,
											{ color: colors.mutedForeground },
										]}
									>
										Suggestions:
									</Text>
									<View style={styles.suggestionChips}>
										{tagSuggestions.map((tag) => (
											<TouchableOpacity
												key={tag.id}
												onPress={() => handleAddTag(tag.name)}
												style={[
													styles.suggestionChip,
													{ backgroundColor: colors.muted },
												]}
											>
												<Text
													style={[
														styles.suggestionChipText,
														{ color: colors.text },
													]}
												>
													+ {tag.name}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</View>
							)}

							<Text style={[styles.hint, { color: colors.mutedForeground }]}>
								These tags will be automatically added to new saves in this
								collection
							</Text>
						</CardContent>
					</Card>

					{/* Add Saves Section */}
					<Card style={styles.section}>
						<CardContent style={styles.sectionContent}>
							<Text style={[styles.sectionLabel, { color: colors.text }]}>
								Add Saves
							</Text>

							{selectedSaveIds.length > 0 ? (
								<View style={styles.selectedSaves}>
									{selectedSaveIds.map((saveId) => {
										const save = saves.find((s) => s.id === saveId);
										if (!save) return null;
										return (
											<View
												key={saveId}
												style={[
													styles.selectedSaveChip,
													{ backgroundColor: `${brandColors.denim.DEFAULT}18` },
												]}
											>
												<Text
													style={[
														styles.selectedSaveText,
														{ color: brandColors.denim.deep },
													]}
													numberOfLines={1}
												>
													{save.title || save.url}
												</Text>
												<TouchableOpacity
													onPress={() => toggleSaveSelection(saveId)}
													hitSlop={8}
												>
													<X size={14} color={brandColors.denim.deep} />
												</TouchableOpacity>
											</View>
										);
									})}
								</View>
							) : null}

							<Button
								variant="outline"
								onPress={() => setShowSaveSelector(!showSaveSelector)}
								style={styles.addSavesButton}
							>
								<Text style={{ color: colors.text }}>
									{showSaveSelector
										? "Hide saves"
										: selectedSaveIds.length > 0
											? "Add more saves"
											: "Select saves to add"}
								</Text>
							</Button>

							{showSaveSelector && saves.length > 0 && (
								<View style={styles.savesList}>
									{saves.slice(0, 10).map((save) => {
										const isSelected = selectedSaveIds.includes(save.id);
										return (
											<Pressable
												key={save.id}
												style={[
													styles.saveItem,
													{
														backgroundColor: isSelected
															? `${brandColors.amber}15`
															: colors.muted,
														borderColor: isSelected
															? brandColors.amber
															: "transparent",
													},
												]}
												onPress={() => toggleSaveSelection(save.id)}
											>
												<View style={styles.saveItemContent}>
													<Text
														style={[
															styles.saveItemTitle,
															{ color: colors.text },
														]}
														numberOfLines={1}
													>
														{save.title || save.url}
													</Text>
													<Text
														style={[
															styles.saveItemUrl,
															{ color: colors.mutedForeground },
														]}
														numberOfLines={1}
													>
														{save.siteName || new URL(save.url).hostname}
													</Text>
												</View>
												{isSelected && (
													<Check size={18} color={brandColors.amber} />
												)}
											</Pressable>
										);
									})}
								</View>
							)}

							<Text style={[styles.hint, { color: colors.mutedForeground }]}>
								You can add saves to this collection later from the save detail
								screen
							</Text>
						</CardContent>
					</Card>

					{/* Create Button */}
					<View style={styles.buttonContainer}>
						<Button
							onPress={handleCreate}
							loading={createCollection.isPending}
							disabled={createCollection.isPending || !canCreate}
							style={styles.createButton}
						>
							Create Collection
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
	// Name Card
	nameCard: {
		marginBottom: 20,
	},
	nameCardContent: {
		padding: 16,
		paddingTop: 16,
	},
	nameInputGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	iconPreview: {
		width: 56,
		height: 56,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	nameInputContainer: {
		flex: 1,
	},
	nameInput: {
		fontSize: 18,
		fontFamily: "DMSans-Medium",
	},
	// Sections
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
		marginTop: 12,
		lineHeight: 18,
	},
	// Visibility
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
	// Default Tags
	sectionLabelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 14,
	},
	defaultTagsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 12,
	},
	defaultTagChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingLeft: 12,
		paddingRight: 8,
		borderRadius: radii.full,
	},
	defaultTagText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	addTagRow: {
		flexDirection: "row",
		gap: 10,
	},
	addTagInput: {
		flex: 1,
		height: 44,
		borderWidth: 1,
		borderRadius: radii.md,
		paddingHorizontal: 12,
		fontSize: 15,
		fontFamily: "DMSans",
	},
	addTagButton: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	tagSuggestions: {
		marginTop: 12,
	},
	suggestionLabel: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginBottom: 8,
	},
	suggestionChips: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	suggestionChip: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: radii.full,
	},
	suggestionChipText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	// Add Saves
	addSavesButton: {
		marginTop: 4,
	},
	selectedSaves: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 12,
	},
	selectedSaveChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 12,
		paddingRight: 8,
		paddingVertical: 6,
		borderRadius: radii.full,
		gap: 6,
		maxWidth: "100%",
	},
	selectedSaveText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		flexShrink: 1,
	},
	savesList: {
		marginTop: 12,
		gap: 8,
	},
	saveItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderRadius: radii.md,
		borderWidth: 1.5,
	},
	saveItemContent: {
		flex: 1,
		marginRight: 8,
	},
	saveItemTitle: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		marginBottom: 2,
	},
	saveItemUrl: {
		fontSize: 12,
		fontFamily: "DMSans",
	},
	// Create button
	buttonContainer: {
		marginTop: 12,
	},
	createButton: {
		height: 52,
	},
});
