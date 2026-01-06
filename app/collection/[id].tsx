/**
 * Collection Detail Screen
 * Shows collection settings and the saves within it
 */

import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
	Archive,
	Check,
	ChevronLeft,
	ExternalLink,
	Eye,
	EyeOff,
	FolderOpen,
	Pencil,
	Plus,
	Star,
	Tag as TagIcon,
	Trash2,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 36;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProcessingBadge } from "@/components/ui/processing-badge";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	useDeleteCollection,
	useGetCollection,
	useUpdateCollection,
} from "@/lib/api/collections";
import {
	useListSaves,
	useToggleArchive,
	useToggleFavorite,
} from "@/lib/api/saves";
import { useListTags } from "@/lib/api/tags";
import type { CollectionVisibility, Save } from "@/lib/api/types";
import { isSaveProcessing } from "@/lib/api/use-processing-saves";
import { useOpenUrl } from "@/lib/utils";

// === Edit Collection Modal ===
interface EditCollectionModalProps {
	visible: boolean;
	onClose: () => void;
	collection: {
		id: string;
		name: string;
		visibility: CollectionVisibility;
		defaultTags?: Array<{ id: string; name: string }>;
	};
	colors: ReturnType<typeof useThemeColors>;
}

// Helper to extract tag names from Tag objects
function getTagNames(tags?: Array<{ name: string }>): string[] {
	return tags?.map((t) => t.name) ?? [];
}

function EditCollectionModal({
	visible,
	onClose,
	collection,
	colors,
}: EditCollectionModalProps) {
	const updateCollection = useUpdateCollection();
	const { data: existingTags = [] } = useListTags();

	const [name, setName] = useState(collection.name);
	const [visibility, setVisibility] = useState<CollectionVisibility>(
		collection.visibility,
	);
	const [defaultTags, setDefaultTags] = useState<string[]>(
		getTagNames(collection.defaultTags),
	);
	const [newTagInput, setNewTagInput] = useState("");

	// Reset form when collection changes
	useEffect(() => {
		setName(collection.name);
		setVisibility(collection.visibility);
		setDefaultTags(getTagNames(collection.defaultTags));
	}, [collection]);

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

	const handleSave = async () => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			Alert.alert("Error", "Collection name cannot be empty");
			return;
		}

		try {
			await updateCollection.mutateAsync({
				id: collection.id,
				name: trimmedName,
				visibility,
				defaultTags,
			});
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			onClose();
		} catch {
			Alert.alert("Error", "Failed to update collection");
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		}
	};

	const originalTagNames = getTagNames(collection.defaultTags);
	const hasChanges =
		name.trim() !== collection.name ||
		visibility !== collection.visibility ||
		JSON.stringify([...defaultTags].sort()) !==
			JSON.stringify([...originalTagNames].sort());

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				style={[styles.modalContainer, { backgroundColor: colors.background }]}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				{/* Header */}
				<View
					style={[styles.modalHeader, { borderBottomColor: colors.border }]}
				>
					<TouchableOpacity onPress={onClose} hitSlop={10}>
						<X size={24} color={colors.text} />
					</TouchableOpacity>
					<Text style={[styles.modalTitle, { color: colors.text }]}>
						Edit Collection
					</Text>
					<View style={{ width: 24 }} />
				</View>

				<ScrollView
					style={styles.modalScrollView}
					contentContainerStyle={styles.modalContent}
					keyboardShouldPersistTaps="handled"
				>
					{/* Name */}
					<View style={styles.field}>
						<Text style={[styles.fieldLabel, { color: colors.text }]}>
							Name
						</Text>
						<Input
							value={name}
							onChangeText={setName}
							placeholder="Collection name"
							autoCapitalize="words"
							style={{ backgroundColor: colors.card }}
						/>
					</View>

					{/* Visibility */}
					<View style={styles.field}>
						<Text style={[styles.fieldLabel, { color: colors.text }]}>
							Visibility
						</Text>
						<View style={styles.visibilityOptions}>
							{(
								[
									{
										value: "private",
										label: "Private",
										icon: EyeOff,
										hint: "Only you can see this collection",
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
												{ color: isSelected ? "#141D22" : colors.text },
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
					</View>

					{/* Default Tags */}
					<View style={styles.field}>
						<View style={styles.fieldHeader}>
							<TagIcon size={16} color={colors.mutedForeground} />
							<Text
								style={[
									styles.fieldLabel,
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
											{ backgroundColor: `${brandColors.denim.DEFAULT}20` },
										]}
									>
										<Text
											style={[
												styles.defaultTagText,
												{ color: brandColors.denim.faded },
											]}
										>
											{tagName}
										</Text>
										<TouchableOpacity
											onPress={() => handleRemoveTag(tagName)}
											hitSlop={8}
										>
											<X size={14} color={brandColors.denim.faded} />
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
					</View>
				</ScrollView>

				{/* Footer */}
				<View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
					<Button variant="ghost" onPress={onClose} style={{ flex: 1 }}>
						Cancel
					</Button>
					<Button
						onPress={handleSave}
						loading={updateCollection.isPending}
						disabled={!hasChanges || !name.trim()}
						style={{ flex: 1 }}
					>
						Save Changes
					</Button>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

// === Save Card (reused pattern) ===
interface SaveCardProps {
	save: Save;
	colors: ReturnType<typeof useThemeColors>;
	onPress: () => void;
	onToggleFavorite: () => void;
	onToggleArchive: () => void;
	onOpenUrl: (url: string) => void;
}

function SaveCard({
	save,
	colors,
	onPress,
	onToggleFavorite,
	onToggleArchive,
	onOpenUrl,
}: SaveCardProps) {
	return (
		<Card style={styles.saveCard}>
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{save.imageUrl && (
					<Image
						source={{ uri: save.imageUrl }}
						style={styles.saveImage}
						resizeMode="cover"
					/>
				)}

				<View style={styles.saveContent}>
					<View style={styles.siteInfo}>
						<Text
							style={[styles.siteName, { color: colors.mutedForeground }]}
							numberOfLines={1}
						>
							{save.siteName || new URL(save.url).hostname}
						</Text>
						{isSaveProcessing(save) && <ProcessingBadge size="sm" />}
						{save.visibility === "public" && (
							<View
								style={[
									styles.visibilityBadge,
									{ backgroundColor: `${brandColors.mint}20` },
								]}
							>
								<Text style={[styles.badgeText, { color: brandColors.mint }]}>
									Public
								</Text>
							</View>
						)}
					</View>

					<Text
						style={[styles.saveTitle, { color: colors.text }]}
						numberOfLines={2}
					>
						{save.title || save.url}
					</Text>

					{save.description && (
						<Text
							style={[
								styles.saveDescription,
								{ color: colors.mutedForeground },
							]}
							numberOfLines={2}
						>
							{save.description}
						</Text>
					)}

					{save.tags && save.tags.length > 0 && (
						<View style={styles.tags}>
							{save.tags.slice(0, 3).map((tag) => (
								<View
									key={tag.id}
									style={[
										styles.tag,
										{ backgroundColor: `${brandColors.denim.DEFAULT}15` },
									]}
								>
									<Text
										style={[styles.tagText, { color: brandColors.denim.deep }]}
									>
										{tag.name}
									</Text>
								</View>
							))}
							{save.tags.length > 3 && (
								<Text
									style={[
										styles.moreTagsText,
										{ color: colors.mutedForeground },
									]}
								>
									+{save.tags.length - 3}
								</Text>
							)}
						</View>
					)}
				</View>
			</TouchableOpacity>

			<View style={[styles.actions, { borderTopColor: colors.border }]}>
				<TouchableOpacity
					onPress={onToggleFavorite}
					style={styles.actionButton}
					activeOpacity={0.7}
				>
					<Star
						size={20}
						color={save.isFavorite ? brandColors.amber : colors.mutedForeground}
						fill={save.isFavorite ? brandColors.amber : "transparent"}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={onToggleArchive}
					style={styles.actionButton}
					activeOpacity={0.7}
				>
					<Archive
						size={20}
						color={save.isArchived ? brandColors.teal : colors.mutedForeground}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={() => onOpenUrl(save.url)}
					style={styles.actionButton}
					activeOpacity={0.7}
				>
					<ExternalLink size={20} color={colors.mutedForeground} />
				</TouchableOpacity>
			</View>
		</Card>
	);
}

export default function CollectionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const colors = useThemeColors();
	const { openUrl } = useOpenUrl();

	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);

	// Fetch collection details
	const {
		data: collection,
		isLoading: isLoadingCollection,
		isError: isCollectionError,
		refetch: refetchCollection,
	} = useGetCollection(id);

	// Fetch saves in this collection
	const {
		data: savesData,
		isPending: isLoadingSaves,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		refetch: refetchSaves,
	} = useListSaves({ collectionId: id, limit: 20 });

	const deleteCollection = useDeleteCollection();
	const toggleFavorite = useToggleFavorite();
	const toggleArchive = useToggleArchive();

	const saves = savesData?.pages.flatMap((page) => page.items) ?? [];

	// Calculate common tags across saves in this collection
	const _commonTags = useMemo(() => {
		const tagCounts = new Map<string, { name: string; count: number }>();
		for (const save of saves) {
			for (const tag of save.tags ?? []) {
				const existing = tagCounts.get(tag.id);
				if (existing) {
					existing.count++;
				} else {
					tagCounts.set(tag.id, { name: tag.name, count: 1 });
				}
			}
		}
		return Array.from(tagCounts.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	}, [saves]);

	const handleRefresh = useCallback(async () => {
		setIsManualRefreshing(true);
		try {
			await Promise.all([refetchCollection(), refetchSaves()]);
		} finally {
			setIsManualRefreshing(false);
		}
	}, [refetchCollection, refetchSaves]);

	const handleLoadMore = useCallback(() => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleToggleFavorite = useCallback(
		async (save: Save) => {
			Haptics.selectionAsync();
			await toggleFavorite.mutateAsync({
				saveId: save.id,
				value: !save.isFavorite,
			});
		},
		[toggleFavorite],
	);

	const handleToggleArchive = useCallback(
		async (save: Save) => {
			Haptics.selectionAsync();
			await toggleArchive.mutateAsync({
				saveId: save.id,
				value: !save.isArchived,
			});
		},
		[toggleArchive],
	);

	const handleDeleteCollection = useCallback(() => {
		if (!collection) return;

		Alert.alert(
			"Delete Collection",
			`Are you sure you want to delete "${collection.name}"? This cannot be undone. Saves in this collection will not be deleted.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
						try {
							await deleteCollection.mutateAsync(collection.id);
							router.back();
						} catch {
							Alert.alert("Error", "Failed to delete collection");
						}
					},
				},
			],
		);
	}, [collection, deleteCollection, router]);

	const renderItem = useCallback(
		({ item }: { item: Save }) => (
			<SaveCard
				save={item}
				colors={colors}
				onPress={() => router.push(`/save/${item.id}`)}
				onToggleFavorite={() => handleToggleFavorite(item)}
				onToggleArchive={() => handleToggleArchive(item)}
				onOpenUrl={openUrl}
			/>
		),
		[colors, router, handleToggleFavorite, handleToggleArchive, openUrl],
	);

	const renderEmpty = useCallback(() => {
		if (isLoadingSaves) return null;

		return (
			<View style={styles.emptyState}>
				<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
					<FolderOpen
						size={48}
						color={colors.mutedForeground}
						strokeWidth={1.5}
					/>
				</View>
				<Text style={[styles.emptyTitle, { color: colors.text }]}>
					No saves in this collection
				</Text>
				<Text
					style={[styles.emptyDescription, { color: colors.mutedForeground }]}
				>
					Add saves to this collection from the save detail screen.
				</Text>
			</View>
		);
	}, [colors, isLoadingSaves]);

	const renderFooter = useCallback(() => {
		if (!isFetchingNextPage) return null;
		return (
			<View style={styles.footer}>
				<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
			</View>
		);
	}, [isFetchingNextPage]);

	const renderHeader = useCallback(() => {
		if (!collection) return null;

		return (
			<View style={styles.headerSection}>
				{/* Collection Info Card */}
				<Card style={styles.infoCard}>
					<View style={styles.infoCardInner}>
						{/* Icon & Name */}
						<View style={styles.collectionHeader}>
							<View
								style={[
									styles.collectionIcon,
									{ backgroundColor: colors.muted },
								]}
							>
								<FolderOpen size={28} color={brandColors.amber} />
							</View>
							<View style={styles.collectionTitleSection}>
								<Text style={[styles.collectionName, { color: colors.text }]}>
									{collection.name}
								</Text>
								<Text
									style={[styles.saveCount, { color: colors.mutedForeground }]}
								>
									{collection._count?.saves ?? saves.length}{" "}
									{(collection._count?.saves ?? saves.length) === 1
										? "save"
										: "saves"}
								</Text>
							</View>
						</View>

						{/* Visibility */}
						<View
							style={[styles.metadataRow, { borderTopColor: colors.border }]}
						>
							{collection.visibility === "public" ? (
								<Eye size={16} color={colors.mutedForeground} />
							) : (
								<EyeOff size={16} color={colors.mutedForeground} />
							)}
							<Text
								style={[
									styles.metadataLabel,
									{ color: colors.mutedForeground },
								]}
							>
								Visibility
							</Text>
							<View
								style={[
									styles.visibilityPill,
									{
										backgroundColor:
											collection.visibility === "public"
												? `${brandColors.mint}20`
												: colors.muted,
									},
								]}
							>
								<Text
									style={[
										styles.visibilityPillText,
										{
											color:
												collection.visibility === "public"
													? brandColors.mint
													: colors.mutedForeground,
										},
									]}
								>
									{collection.visibility === "public" ? "Public" : "Private"}
								</Text>
							</View>
						</View>

						{/* Default Tags */}
						<View
							style={[
								styles.defaultTagsSection,
								{ borderTopColor: colors.border },
							]}
						>
							<View style={styles.defaultTagsHeader}>
								<TagIcon size={16} color={brandColors.amber} />
								<Text
									style={[
										styles.metadataLabel,
										{ color: colors.mutedForeground },
									]}
								>
									Default Tags
								</Text>
							</View>
							{collection.defaultTags && collection.defaultTags.length > 0 ? (
								<View style={styles.defaultTagsList}>
									{collection.defaultTags.map((tag) => (
										<View
											key={tag.id}
											style={[
												styles.defaultTagDisplay,
												{ backgroundColor: `${brandColors.amber}20` },
											]}
										>
											<Text
												style={[
													styles.defaultTagDisplayText,
													{ color: brandColors.amber },
												]}
											>
												{tag.name}
											</Text>
										</View>
									))}
								</View>
							) : (
								<Text
									style={[
										styles.noDefaultTags,
										{ color: colors.mutedForeground },
									]}
								>
									No default tags set
								</Text>
							)}
						</View>
					</View>
				</Card>

				{/* Actions */}
				<View style={styles.headerActions}>
					<Button
						variant="outline"
						onPress={handleDeleteCollection}
						style={styles.deleteButton}
					>
						<Trash2 size={16} color={colors.destructive} />
						<Text
							style={[styles.deleteButtonText, { color: colors.destructive }]}
						>
							Delete Collection
						</Text>
					</Button>
				</View>

				{/* Saves Section Title */}
				<Text style={[styles.sectionTitle, { color: colors.text }]}>Saves</Text>
			</View>
		);
	}, [collection, colors, saves.length, handleDeleteCollection]);

	// Loading state
	if (isLoadingCollection) {
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

	// Error state
	if (isCollectionError || !collection) {
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
						Collection not found
					</Text>
					<Button onPress={() => router.back()} style={{ marginTop: 16 }}>
						Go Back
					</Button>
				</View>
			</>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					title: collection.name,
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
							onPress={() => setIsEditModalVisible(true)}
							style={styles.headerButton}
						>
							<Pencil size={18} color={colors.text} />
						</TouchableOpacity>
					),
				}}
			/>

			<FlatList
				data={saves}
				renderItem={renderItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={
					saves.length === 0 ? styles.emptyContainer : styles.listContent
				}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={renderEmpty}
				ListFooterComponent={renderFooter}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				refreshControl={
					<RefreshControl
						refreshing={isManualRefreshing}
						onRefresh={handleRefresh}
						tintColor={brandColors.rust.DEFAULT}
					/>
				}
				style={{ backgroundColor: colors.background }}
			/>

			{/* Edit Modal */}
			<EditCollectionModal
				visible={isEditModalVisible}
				onClose={() => setIsEditModalVisible(false)}
				collection={collection}
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
	listContent: {
		paddingBottom: 40,
	},
	emptyContainer: {
		flexGrow: 1,
	},
	// Header Section
	headerSection: {
		padding: 16,
		paddingBottom: 8,
	},
	infoCard: {
		marginBottom: 16,
	},
	infoCardInner: {
		padding: 16,
	},
	collectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 20,
	},
	collectionIcon: {
		width: 56,
		height: 56,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	collectionTitleSection: {
		flex: 1,
	},
	collectionName: {
		fontSize: 22,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 4,
	},
	saveCount: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	metadataRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(255,255,255,0.1)",
	},
	metadataLabel: {
		fontSize: 14,
		fontFamily: "DMSans",
		flex: 1,
	},
	visibilityPill: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: radii.full,
	},
	visibilityPillText: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	defaultTagsSection: {
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	defaultTagsHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	defaultTagsList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	defaultTagDisplay: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: radii.full,
	},
	defaultTagDisplayText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	noDefaultTags: {
		fontSize: 13,
		fontFamily: "DMSans",
		fontStyle: "italic",
	},
	commonTagsSection: {
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	commonTagsHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 10,
	},
	commonTagsList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	commonTag: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: radii.full,
		gap: 6,
	},
	commonTagText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	commonTagCount: {
		fontSize: 11,
		fontFamily: "DMSans",
	},
	headerActions: {
		marginBottom: 20,
	},
	deleteButton: {
		flexDirection: "row",
		gap: 8,
	},
	deleteButtonText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	sectionTitle: {
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		marginBottom: 12,
	},
	// Empty State
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
		paddingTop: 40,
	},
	iconContainer: {
		width: 96,
		height: 96,
		borderRadius: 48,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 20,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 8,
	},
	emptyDescription: {
		fontSize: 15,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 22,
	},
	errorText: {
		fontSize: 16,
		fontFamily: "DMSans",
		textAlign: "center",
	},
	footer: {
		paddingVertical: 20,
		alignItems: "center",
	},
	// Save Card
	saveCard: {
		marginHorizontal: 16,
		marginBottom: 16,
		overflow: "hidden",
	},
	saveImage: {
		width: "100%",
		height: 160,
	},
	saveContent: {
		padding: 16,
	},
	siteInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
	},
	siteName: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		flex: 1,
	},
	visibilityBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: radii.sm,
	},
	badgeText: {
		fontSize: 11,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	saveTitle: {
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		lineHeight: 22,
		marginBottom: 4,
	},
	saveDescription: {
		fontSize: 14,
		fontFamily: "DMSans",
		lineHeight: 20,
		marginTop: 4,
	},
	tags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 12,
	},
	tag: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: radii.sm,
	},
	tagText: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
	},
	moreTagsText: {
		fontSize: 12,
		fontFamily: "DMSans",
		alignSelf: "center",
	},
	actions: {
		flexDirection: "row",
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingVertical: 8,
		paddingHorizontal: 8,
	},
	actionButton: {
		padding: 8,
		marginHorizontal: 4,
	},
	// Modal
	modalContainer: {
		flex: 1,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	modalTitle: {
		fontSize: 17,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	modalScrollView: {
		flex: 1,
	},
	modalContent: {
		padding: 20,
		paddingBottom: 40,
	},
	modalFooter: {
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	field: {
		marginBottom: 24,
	},
	fieldLabel: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 8,
	},
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
	hint: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginTop: 10,
		lineHeight: 18,
	},
	// Modal tag editing
	fieldHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 10,
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
});
