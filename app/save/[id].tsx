/**
 * Save Detail Screen
 * Shows a single save with all its details and actions
 */

import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
	Archive,
	BookOpen,
	Check,
	ChevronLeft,
	ExternalLink,
	Eye,
	EyeOff,
	FolderOpen,
	Pencil,
	Plus,
	Star,
	Tag,
	Trash2,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 36;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useCreateCollection, useListCollections } from "@/lib/api/collections";
import {
	useDeleteSave,
	useGetSave,
	useToggleArchive,
	useToggleFavorite,
	useUpdateSave,
} from "@/lib/api/saves";
import { useListTags } from "@/lib/api/tags";
import type { Save, SaveVisibility } from "@/lib/api/types";
import { isSaveProcessing } from "@/lib/api/use-processing-saves";
import { useOpenUrl } from "@/lib/utils";

// === Visibility Selector Component ===
interface VisibilitySelectorProps {
	value: SaveVisibility;
	onChange: (value: SaveVisibility) => void;
	colors: ReturnType<typeof useThemeColors>;
	showHint?: boolean;
}

function VisibilitySelector({
	value,
	onChange,
	colors,
	showHint = true,
}: VisibilitySelectorProps) {
	const options: {
		value: SaveVisibility;
		label: string;
		icon: typeof Eye;
		hint: string;
	}[] = [
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
	];

	const selectedOption = options.find((o) => o.value === value);

	return (
		<View>
			<View style={visibilityStyles.container}>
				{options.map((option) => {
					const isSelected = value === option.value;
					const Icon = option.icon;
					return (
						<Pressable
							key={option.value}
							onPress={() => {
								Haptics.selectionAsync();
								onChange(option.value);
							}}
							style={[
								visibilityStyles.option,
								{
									backgroundColor: isSelected
										? brandColors.amber
										: colors.muted,
									borderColor: isSelected ? brandColors.amber : colors.border,
								},
							]}
						>
							<Icon
								size={16}
								color={isSelected ? "#141D22" : colors.mutedForeground}
							/>
							<Text
								style={[
									visibilityStyles.optionText,
									{ color: isSelected ? "#141D22" : colors.text },
								]}
							>
								{option.label}
							</Text>
							{isSelected && (
								<Check size={14} color="#141D22" style={{ marginLeft: 2 }} />
							)}
						</Pressable>
					);
				})}
			</View>
			{showHint && selectedOption && (
				<Text
					style={[visibilityStyles.hint, { color: colors.mutedForeground }]}
				>
					{selectedOption.hint}
				</Text>
			)}
		</View>
	);
}

const visibilityStyles = StyleSheet.create({
	container: {
		flexDirection: "row",
		gap: 10,
	},
	option: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: radii.md,
		borderWidth: 1.5,
	},
	optionText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	hint: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginTop: 10,
		lineHeight: 18,
	},
});

// === Tag Chip Component ===
interface TagChipProps {
	name: string;
	onRemove?: () => void;
	colors: ReturnType<typeof useThemeColors>;
}

function TagChip({ name, onRemove }: TagChipProps) {
	return (
		<View
			style={[
				tagChipStyles.chip,
				{ backgroundColor: `${brandColors.denim.DEFAULT}20` },
			]}
		>
			<Text style={[tagChipStyles.text, { color: brandColors.denim.faded }]}>
				{name}
			</Text>
			{onRemove && (
				<TouchableOpacity
					onPress={onRemove}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<X size={14} color={brandColors.denim.faded} />
				</TouchableOpacity>
			)}
		</View>
	);
}

const tagChipStyles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 6,
		paddingLeft: 12,
		paddingRight: 8,
		borderRadius: radii.full,
	},
	text: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
});

// === Collection Chip Component ===
interface CollectionChipProps {
	name: string;
	isSelected: boolean;
	onToggle: () => void;
	colors: ReturnType<typeof useThemeColors>;
}

function CollectionChip({
	name,
	isSelected,
	onToggle,
	colors,
}: CollectionChipProps) {
	return (
		<Pressable
			onPress={onToggle}
			style={[
				collectionChipStyles.chip,
				{
					backgroundColor: isSelected ? brandColors.amber : colors.muted,
					borderColor: isSelected ? brandColors.amber : colors.border,
				},
			]}
		>
			<Text
				style={[
					collectionChipStyles.text,
					{ color: isSelected ? "#141D22" : colors.text },
				]}
			>
				{name}
			</Text>
			{isSelected && <Check size={14} color="#141D22" />}
		</Pressable>
	);
}

const collectionChipStyles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: radii.full,
		borderWidth: 1,
	},
	text: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
});

// === Edit Save Modal ===
interface EditSaveModalProps {
	visible: boolean;
	onClose: () => void;
	save: Save;
	colors: ReturnType<typeof useThemeColors>;
}

function EditSaveModal({ visible, onClose, save, colors }: EditSaveModalProps) {
	const updateSave = useUpdateSave();
	const createCollection = useCreateCollection();
	const { data: existingTags = [] } = useListTags();
	const { data: existingCollections = [] } = useListCollections();

	// Form state
	const [title, setTitle] = useState(save.title || "");
	const [description, setDescription] = useState(save.description || "");
	const [visibility, setVisibility] = useState<SaveVisibility>(save.visibility);
	const [tagNames, setTagNames] = useState<string[]>(
		save.tags?.map((t) => t.name) || [],
	);
	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
		save.collections?.map((c) => c.id) || [],
	);
	const [newTagInput, setNewTagInput] = useState("");
	const [newCollectionInput, setNewCollectionInput] = useState("");
	const [isCreatingCollection, setIsCreatingCollection] = useState(false);

	// Reset form when save changes
	useEffect(() => {
		setTitle(save.title || "");
		setDescription(save.description || "");
		setVisibility(save.visibility);
		setTagNames(save.tags?.map((t) => t.name) || []);
		setSelectedCollectionIds(save.collections?.map((c) => c.id) || []);
	}, [save]);

	// Tag suggestions (existing tags not already added)
	const tagSuggestions = useMemo(() => {
		const lowerTagNames = tagNames.map((t) => t.toLowerCase());
		return existingTags
			.filter((t) => !lowerTagNames.includes(t.name.toLowerCase()))
			.slice(0, 5);
	}, [existingTags, tagNames]);

	const handleAddTag = (name: string) => {
		const trimmed = name.trim().toLowerCase();
		if (trimmed && !tagNames.map((t) => t.toLowerCase()).includes(trimmed)) {
			setTagNames([...tagNames, trimmed]);
		}
		setNewTagInput("");
	};

	const handleRemoveTag = (name: string) => {
		setTagNames(tagNames.filter((t) => t.toLowerCase() !== name.toLowerCase()));
	};

	const handleToggleCollection = (collectionId: string) => {
		Haptics.selectionAsync();
		if (selectedCollectionIds.includes(collectionId)) {
			setSelectedCollectionIds(
				selectedCollectionIds.filter((id) => id !== collectionId),
			);
		} else {
			setSelectedCollectionIds([...selectedCollectionIds, collectionId]);
		}
	};

	const handleCreateCollection = async () => {
		const name = newCollectionInput.trim();
		if (!name) return;

		setIsCreatingCollection(true);
		try {
			const newCollection = await createCollection.mutateAsync({ name });
			setSelectedCollectionIds([...selectedCollectionIds, newCollection.id]);
			setNewCollectionInput("");
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			Alert.alert("Error", "Failed to create collection");
		} finally {
			setIsCreatingCollection(false);
		}
	};

	const handleSave = async () => {
		try {
			await updateSave.mutateAsync({
				id: save.id,
				title: title || undefined,
				description: description || undefined,
				visibility,
				tagNames,
				collectionIds: selectedCollectionIds,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			onClose();
		} catch {
			Alert.alert("Error", "Failed to update save");
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	};

	const hasChanges =
		title !== (save.title || "") ||
		description !== (save.description || "") ||
		visibility !== save.visibility ||
		JSON.stringify(tagNames.sort()) !==
			JSON.stringify((save.tags?.map((t) => t.name) || []).sort()) ||
		JSON.stringify(selectedCollectionIds.sort()) !==
			JSON.stringify((save.collections?.map((c) => c.id) || []).sort());

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				style={[modalStyles.container, { backgroundColor: colors.background }]}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
			>
				<View
					style={[
						modalStyles.keyboardInner,
						{ backgroundColor: colors.background },
					]}
				>
					{/* Header */}
					<View
						style={[modalStyles.header, { borderBottomColor: colors.border }]}
					>
						<TouchableOpacity
							onPress={onClose}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<X size={24} color={colors.text} />
						</TouchableOpacity>
						<Text style={[modalStyles.headerTitle, { color: colors.text }]}>
							Edit save
						</Text>
						<View style={{ width: 24 }} />
					</View>

					<ScrollView
						style={modalStyles.scrollView}
						contentContainerStyle={modalStyles.scrollContent}
						keyboardShouldPersistTaps="handled"
					>
						{/* Title */}
						<View style={modalStyles.field}>
							<Text style={[modalStyles.label, { color: colors.text }]}>
								Title
							</Text>
							<Input
								value={title}
								onChangeText={setTitle}
								placeholder="Enter title"
								style={{ backgroundColor: colors.card }}
							/>
						</View>

						{/* Description */}
						<View style={modalStyles.field}>
							<Text style={[modalStyles.label, { color: colors.text }]}>
								Description
							</Text>
							<TextInput
								value={description}
								onChangeText={setDescription}
								placeholder="Add a description..."
								placeholderTextColor={colors.mutedForeground}
								multiline
								numberOfLines={3}
								style={[
									modalStyles.textArea,
									{
										backgroundColor: colors.card,
										borderColor: colors.border,
										color: colors.text,
									},
								]}
							/>
						</View>

						{/* Visibility */}
						<View style={modalStyles.field}>
							<Text style={[modalStyles.label, { color: colors.text }]}>
								Visibility
							</Text>
							<VisibilitySelector
								value={visibility}
								onChange={setVisibility}
								colors={colors}
							/>
						</View>

						{/* Tags */}
						<View style={modalStyles.field}>
							<View style={modalStyles.fieldHeader}>
								<Tag size={16} color={colors.mutedForeground} />
								<Text
									style={[
										modalStyles.label,
										{ color: colors.text, marginBottom: 0 },
									]}
								>
									Tags
								</Text>
							</View>

							{/* Current tags */}
							{tagNames.length > 0 && (
								<View style={modalStyles.chipRow}>
									{tagNames.map((name) => (
										<TagChip
											key={name}
											name={name}
											onRemove={() => handleRemoveTag(name)}
											colors={colors}
										/>
									))}
								</View>
							)}

							{/* Add tag input */}
							<View style={modalStyles.addRow}>
								<TextInput
									value={newTagInput}
									onChangeText={setNewTagInput}
									placeholder="Add a tag..."
									placeholderTextColor={colors.mutedForeground}
									onSubmitEditing={() => handleAddTag(newTagInput)}
									returnKeyType="done"
									style={[
										modalStyles.addInput,
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
										modalStyles.addButton,
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
								<View style={modalStyles.suggestions}>
									<Text
										style={[
											modalStyles.suggestionLabel,
											{ color: colors.mutedForeground },
										]}
									>
										Suggestions:
									</Text>
									<View style={modalStyles.chipRow}>
										{tagSuggestions.map((tag) => (
											<TouchableOpacity
												key={tag.id}
												onPress={() => handleAddTag(tag.name)}
												style={[
													modalStyles.suggestionChip,
													{ backgroundColor: colors.muted },
												]}
											>
												<Text
													style={[
														modalStyles.suggestionChipText,
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
						</View>

						{/* Collections */}
						<View style={modalStyles.field}>
							<View style={modalStyles.fieldHeader}>
								<FolderOpen size={16} color={colors.mutedForeground} />
								<Text
									style={[
										modalStyles.label,
										{ color: colors.text, marginBottom: 0 },
									]}
								>
									Collections
								</Text>
							</View>

							{/* Existing collections */}
							{existingCollections.length > 0 && (
								<View style={modalStyles.chipRow}>
									{existingCollections.map((collection) => (
										<CollectionChip
											key={collection.id}
											name={collection.name}
											isSelected={selectedCollectionIds.includes(collection.id)}
											onToggle={() => handleToggleCollection(collection.id)}
											colors={colors}
										/>
									))}
								</View>
							)}

							{/* Create new collection */}
							<View style={modalStyles.addRow}>
								<TextInput
									value={newCollectionInput}
									onChangeText={setNewCollectionInput}
									placeholder="Create new collection..."
									placeholderTextColor={colors.mutedForeground}
									onSubmitEditing={handleCreateCollection}
									returnKeyType="done"
									style={[
										modalStyles.addInput,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
											color: colors.text,
										},
									]}
								/>
								<TouchableOpacity
									onPress={handleCreateCollection}
									disabled={!newCollectionInput.trim() || isCreatingCollection}
									style={[
										modalStyles.addButton,
										{
											backgroundColor: newCollectionInput.trim()
												? brandColors.amber
												: colors.muted,
										},
									]}
								>
									{isCreatingCollection ? (
										<ActivityIndicator size="small" color="#141D22" />
									) : (
										<Plus
											size={20}
											color={
												newCollectionInput.trim()
													? "#141D22"
													: colors.mutedForeground
											}
										/>
									)}
								</TouchableOpacity>
							</View>
							<Text
								style={[modalStyles.hint, { color: colors.mutedForeground }]}
							>
								Click to select, or create a new collection
							</Text>
						</View>
					</ScrollView>

					{/* Footer */}
					<View style={[modalStyles.footer, { borderTopColor: colors.border }]}>
						<Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>
							Cancel
						</Button>
						<Button
							onPress={handleSave}
							loading={updateSave.isPending}
							disabled={!hasChanges}
							style={{ flex: 1 }}
						>
							Save changes
						</Button>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const modalStyles = StyleSheet.create({
	container: {
		flex: 1,
	},
	keyboardInner: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerTitle: {
		fontSize: 17,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	field: {
		marginBottom: 24,
	},
	fieldHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 10,
	},
	label: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 8,
	},
	textArea: {
		minHeight: 80,
		borderWidth: 1,
		borderRadius: radii.md,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
		fontFamily: "DMSans",
		textAlignVertical: "top",
	},
	chipRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 12,
	},
	addRow: {
		flexDirection: "row",
		gap: 10,
	},
	addInput: {
		flex: 1,
		height: 44,
		borderWidth: 1,
		borderRadius: radii.md,
		paddingHorizontal: 12,
		fontSize: 15,
		fontFamily: "DMSans",
	},
	addButton: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	suggestions: {
		marginTop: 12,
	},
	suggestionLabel: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginBottom: 8,
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
	hint: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginTop: 8,
	},
	footer: {
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
});

export default function SaveDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const colors = useThemeColors();
	const { openUrl } = useOpenUrl();

	const { data: save, isLoading, isError } = useGetSave(id);
	const toggleFavorite = useToggleFavorite();
	const toggleArchive = useToggleArchive();
	const deleteSave = useDeleteSave();

	const [isDeleting, setIsDeleting] = useState(false);
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);

	const handleToggleFavorite = useCallback(async () => {
		if (!save) return;
		Haptics.selectionAsync();
		await toggleFavorite.mutateAsync({
			saveId: save.id,
			value: !save.isFavorite,
		});
	}, [save, toggleFavorite]);

	const [isArchiving, setIsArchiving] = useState(false);

	const handleToggleArchive = useCallback(() => {
		if (!save) return;

		const action = save.isArchived ? "Unarchive" : "Archive";
		const message = save.isArchived
			? "This will move the save back to your active saves."
			: "This will archive the save. You can unarchive it later.";

		Alert.alert(`${action} Save`, message, [
			{ text: "Cancel", style: "cancel" },
			{
				text: action,
				onPress: async () => {
					setIsArchiving(true);
					try {
						await toggleArchive.mutateAsync({
							saveId: save.id,
							value: !save.isArchived,
						});
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					} catch {
						Alert.alert("Error", `Failed to ${action.toLowerCase()} save`);
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
					} finally {
						setIsArchiving(false);
					}
				},
			},
		]);
	}, [save, toggleArchive]);

	const handleOpenUrl = useCallback(() => {
		if (!save) return;
		openUrl(save.url);
	}, [save, openUrl]);

	const _handleShare = useCallback(async () => {
		if (!save) return;
		try {
			if (await Sharing.isAvailableAsync()) {
				// Note: Sharing.shareAsync is for files, use native share for URLs
				await Sharing.shareAsync(save.url);
			}
		} catch (_error) {
			console.error("Share failed:", _error);
		}
	}, [save]);

	const handleDelete = useCallback(() => {
		if (!save) return;

		Alert.alert(
			"Delete Save",
			"Are you sure you want to delete this save? This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setIsDeleting(true);
						try {
							await deleteSave.mutateAsync(save.id);
							Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Success,
							);
							router.back();
						} catch {
							Alert.alert("Error", "Failed to delete save");
							Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
						} finally {
							setIsDeleting(false);
						}
					},
				},
			],
		);
	}, [save, deleteSave, router]);

	if (isLoading) {
		return (
			<>
				<Stack.Screen
					options={{
						title: "Loading...",
						headerLeft: () => (
							<TouchableOpacity
								onPress={() => router.back()}
								style={styles.headerButton}
							>
								<ChevronLeft size={24} color={colors.text} />
							</TouchableOpacity>
						),
					}}
				/>
				<View
					style={[
						styles.container,
						styles.centered,
						{ backgroundColor: colors.background },
					]}
				>
					<ActivityIndicator size="large" color={brandColors.rust.DEFAULT} />
				</View>
			</>
		);
	}

	if (isError || !save) {
		return (
			<>
				<Stack.Screen
					options={{
						title: "Error",
						headerLeft: () => (
							<TouchableOpacity
								onPress={() => router.back()}
								style={styles.headerButton}
							>
								<ChevronLeft size={24} color={colors.text} />
							</TouchableOpacity>
						),
					}}
				/>
				<View
					style={[
						styles.container,
						styles.centered,
						{ backgroundColor: colors.background },
					]}
				>
					<Text style={[styles.errorText, { color: colors.destructive }]}>
						Save not found
					</Text>
					<Button onPress={() => router.back()} style={{ marginTop: 16 }}>
						Go Back
					</Button>
				</View>
			</>
		);
	}

	// Show processing state while the backend is fetching metadata
	if (isSaveProcessing(save)) {
		return (
			<>
				<Stack.Screen
					options={{
						title: new URL(save.url).hostname,
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
								onPress={handleOpenUrl}
								style={styles.headerButton}
							>
								<ExternalLink size={20} color={colors.text} />
							</TouchableOpacity>
						),
					}}
				/>
				<View
					style={[
						styles.container,
						styles.centered,
						{ backgroundColor: colors.background },
					]}
				>
					<View style={styles.processingContainer}>
						<ActivityIndicator
							size="large"
							color={brandColors.amber}
							style={styles.processingSpinner}
						/>
						<Text style={[styles.processingTitle, { color: colors.text }]}>
							Processing Save
						</Text>
						<Text
							style={[
								styles.processingDescription,
								{ color: colors.mutedForeground },
							]}
						>
							Fetching title, description, and preview image...
						</Text>
						<TouchableOpacity
							onPress={handleOpenUrl}
							style={styles.processingUrlContainer}
						>
							<Text
								style={[
									styles.processingUrl,
									{ color: brandColors.rust.DEFAULT },
								]}
								numberOfLines={2}
							>
								{save.url}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: save.siteName || new URL(save.url).hostname,
					headerLeft: () => (
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.headerButton}
						>
							<ChevronLeft size={24} color={colors.text} />
						</TouchableOpacity>
					),
					headerRight: () => (
						<View style={styles.headerRightContainer}>
							<TouchableOpacity
								onPress={() => setIsEditModalVisible(true)}
								style={styles.headerButton}
							>
								<Pencil size={18} color={colors.text} />
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleOpenUrl}
								style={styles.headerButton}
							>
								<ExternalLink size={20} color={colors.text} />
							</TouchableOpacity>
						</View>
					),
				}}
			/>

			<ScrollView
				style={[styles.container, { backgroundColor: colors.background }]}
				contentContainerStyle={styles.content}
			>
				{/* Image */}
				{save.imageUrl && (
					<Image
						source={{ uri: save.imageUrl }}
						style={styles.image}
						resizeMode="cover"
					/>
				)}

				{/* Main Info */}
				<View style={styles.mainInfo}>
					{/* Title */}
					<Text style={[styles.title, { color: colors.text }]}>
						{save.title || "Untitled"}
					</Text>

					{/* URL */}
					<TouchableOpacity onPress={handleOpenUrl}>
						<Text
							style={[styles.url, { color: brandColors.rust.DEFAULT }]}
							numberOfLines={2}
						>
							{save.url}
						</Text>
					</TouchableOpacity>

					{/* Description */}
					{save.description && (
						<Text
							style={[styles.description, { color: colors.mutedForeground }]}
						>
							{save.description}
						</Text>
					)}
				</View>

				{/* Quick Actions */}
				<View style={styles.quickActions}>
					<TouchableOpacity
						style={[styles.quickAction, { backgroundColor: colors.card }]}
						onPress={handleToggleFavorite}
					>
						<Star
							size={24}
							color={
								save.isFavorite ? brandColors.amber : colors.mutedForeground
							}
							fill={save.isFavorite ? brandColors.amber : "transparent"}
						/>
						<Text style={[styles.quickActionText, { color: colors.text }]}>
							{save.isFavorite ? "Favorited" : "Favorite"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.quickAction, { backgroundColor: colors.card }]}
						onPress={handleOpenUrl}
					>
						<ExternalLink size={24} color={colors.mutedForeground} />
						<Text style={[styles.quickActionText, { color: colors.text }]}>
							Open
						</Text>
					</TouchableOpacity>
				</View>

				{/* Metadata */}
				<Card style={styles.metadataCard}>
					<CardContent style={styles.metadataContent}>
						{/* Visibility */}
						<View style={styles.metadataRow}>
							{save.visibility === "public" ? (
								<Eye size={18} color={colors.mutedForeground} />
							) : (
								<EyeOff size={18} color={colors.mutedForeground} />
							)}
							<Text
								style={[
									styles.metadataLabel,
									{ color: colors.mutedForeground },
								]}
							>
								Visibility
							</Text>
							<Text style={[styles.metadataValue, { color: colors.text }]}>
								{save.visibility.charAt(0).toUpperCase() +
									save.visibility.slice(1)}
							</Text>
						</View>

						{/* Site */}
						{save.siteName && (
							<View
								style={[styles.metadataRow, { borderTopColor: colors.border }]}
							>
								<ExternalLink size={18} color={colors.mutedForeground} />
								<Text
									style={[
										styles.metadataLabel,
										{ color: colors.mutedForeground },
									]}
								>
									Source
								</Text>
								<Text style={[styles.metadataValue, { color: colors.text }]}>
									{save.siteName}
								</Text>
							</View>
						)}

						{/* Saved date */}
						<View
							style={[styles.metadataRow, { borderTopColor: colors.border }]}
						>
							<BookOpen size={18} color={colors.mutedForeground} />
							<Text
								style={[
									styles.metadataLabel,
									{ color: colors.mutedForeground },
								]}
							>
								Saved
							</Text>
							<Text style={[styles.metadataValue, { color: colors.text }]}>
								{new Date(save.savedAt).toLocaleDateString()}
							</Text>
						</View>
					</CardContent>
				</Card>

				{/* Tags */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<View style={styles.sectionHeader}>
							<Tag size={18} color={colors.mutedForeground} />
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								Tags
							</Text>
						</View>
						{save.tags && save.tags.length > 0 ? (
							<View style={styles.tags}>
								{save.tags.map((tag) => (
									<View
										key={tag.id}
										style={[
											styles.tag,
											{ backgroundColor: `${brandColors.denim.DEFAULT}20` },
										]}
									>
										<Text
											style={[
												styles.tagText,
												{ color: brandColors.denim.faded },
											]}
										>
											{tag.name}
										</Text>
									</View>
								))}
							</View>
						) : (
							<Text
								style={[styles.emptyText, { color: colors.mutedForeground }]}
							>
								No tags added
							</Text>
						)}
					</CardContent>
				</Card>

				{/* Collections */}
				<Card style={styles.section}>
					<CardContent style={styles.sectionContent}>
						<View style={styles.sectionHeader}>
							<FolderOpen size={18} color={colors.mutedForeground} />
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								Collections
							</Text>
						</View>
						{save.collections && save.collections.length > 0 ? (
							<View style={styles.collections}>
								{save.collections.map((collection) => (
									<View
										key={collection.id}
										style={[
											styles.collection,
											{ backgroundColor: colors.muted },
										]}
									>
										<FolderOpen size={16} color={colors.mutedForeground} />
										<Text
											style={[styles.collectionText, { color: colors.text }]}
										>
											{collection.name}
										</Text>
									</View>
								))}
							</View>
						) : (
							<Text
								style={[styles.emptyText, { color: colors.mutedForeground }]}
							>
								Not in any collections
							</Text>
						)}
					</CardContent>
				</Card>

				{/* Actions Zone */}
				<View style={styles.actionsZone}>
					<Button
						variant="outline"
						onPress={handleToggleArchive}
						loading={isArchiving}
						style={styles.actionButton}
					>
						<Archive
							size={18}
							color={
								save.isArchived
									? brandColors.denim.DEFAULT
									: colors.mutedForeground
							}
						/>
						<Text style={[styles.actionButtonText, { color: colors.text }]}>
							{save.isArchived ? "Unarchive Save" : "Archive Save"}
						</Text>
					</Button>

					<Button
						variant="destructive"
						onPress={handleDelete}
						loading={isDeleting}
						style={styles.actionButton}
					>
						<Trash2 size={18} color="#FFFFFF" />
						<Text style={styles.deleteButtonText}>Delete Save</Text>
					</Button>
				</View>
			</ScrollView>

			{/* Edit Modal */}
			<EditSaveModal
				visible={isEditModalVisible}
				onClose={() => setIsEditModalVisible(false)}
				save={save}
				colors={colors}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centered: {
		justifyContent: "center",
		alignItems: "center",
	},
	headerButton: {
		width: HEADER_BUTTON_SIZE,
		height: HEADER_BUTTON_SIZE,
		borderRadius: HEADER_BUTTON_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	headerRightContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	content: {
		paddingBottom: 40,
	},
	image: {
		width: "100%",
		height: 200,
	},
	mainInfo: {
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		lineHeight: 30,
		marginBottom: 8,
	},
	url: {
		fontSize: 14,
		fontFamily: "DMSans",
		marginBottom: 12,
	},
	description: {
		fontSize: 15,
		fontFamily: "DMSans",
		lineHeight: 22,
	},
	quickActions: {
		flexDirection: "row",
		paddingHorizontal: 16,
		gap: 12,
		marginBottom: 20,
	},
	quickAction: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 16,
		borderRadius: radii.md,
		gap: 6,
	},
	quickActionText: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
	},
	metadataCard: {
		marginHorizontal: 16,
		marginBottom: 16,
	},
	metadataContent: {
		padding: 0,
	},
	metadataRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderTopWidth: StyleSheet.hairlineWidth,
		gap: 12,
	},
	metadataLabel: {
		fontSize: 14,
		fontFamily: "DMSans",
		flex: 1,
	},
	metadataValue: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	section: {
		marginHorizontal: 16,
		marginBottom: 16,
	},
	sectionContent: {
		paddingTop: 16,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 15,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	tags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tag: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: radii.full,
	},
	tagText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	collections: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	collection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: radii.full,
	},
	collectionText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	emptyText: {
		fontSize: 14,
		fontFamily: "DMSans",
		fontStyle: "italic",
	},
	actionsZone: {
		marginHorizontal: 16,
		marginTop: 24,
		paddingTop: 24,
		borderTopWidth: 1,
		borderTopColor: "#88888820",
		gap: 12,
	},
	actionButton: {
		flexDirection: "row",
		gap: 8,
	},
	actionButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	deleteButtonText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	errorText: {
		fontSize: 16,
		fontFamily: "DMSans",
		textAlign: "center",
	},
	processingContainer: {
		alignItems: "center",
		paddingHorizontal: 32,
	},
	processingSpinner: {
		marginBottom: 24,
	},
	processingTitle: {
		fontSize: 20,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 8,
	},
	processingDescription: {
		fontSize: 15,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 20,
	},
	processingUrlContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: radii.md,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
	},
	processingUrl: {
		fontSize: 14,
		fontFamily: "DMSans",
		textAlign: "center",
	},
});
