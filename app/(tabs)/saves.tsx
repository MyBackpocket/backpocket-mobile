import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Archive,
	Bookmark,
	Check,
	ChevronUp,
	ExternalLink,
	Filter,
	FolderOpen,
	Globe,
	Plus,
	Search,
	Star,
	Tag as TagIcon,
	X,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProcessingBadge } from "@/components/ui/processing-badge";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useListCollections } from "@/lib/api/collections";
import {
	useListSaves,
	useToggleArchive,
	useToggleFavorite,
} from "@/lib/api/saves";
import { useListTags } from "@/lib/api/tags";
import type { Collection, ListSavesInput, Save, Tag } from "@/lib/api/types";
import { isSaveProcessing } from "@/lib/api/use-processing-saves";
import { useOpenUrl } from "@/lib/utils";

type QuickFilterType = "all" | "favorites" | "public";

const quickFilterLabels: Record<QuickFilterType, string> = {
	all: "All Saves",
	favorites: "Favorites",
	public: "Public",
};

const quickFilterOptions: {
	value: QuickFilterType;
	label: string;
	icon: typeof Star;
}[] = [
	{ value: "all", label: "All Saves", icon: Bookmark },
	{ value: "favorites", label: "Favorites", icon: Star },
	{ value: "public", label: "Public", icon: Globe },
];

export default function SavesScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { filter, tagId, tagName, collectionId, collectionName } =
		useLocalSearchParams<{
			filter?: QuickFilterType;
			tagId?: string;
			tagName?: string;
			collectionId?: string;
			collectionName?: string;
		}>();
	const [showFilterModal, setShowFilterModal] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const { openUrl } = useOpenUrl();

	// Fetch tags and collections for filter modal
	const { data: tags } = useListTags();
	const { data: collections } = useListCollections();

	// Derive active filters from URL params (except search which is local)
	const activeQuickFilter: QuickFilterType = filter || "all";
	const activeTagId = tagId || null;
	const activeTagName = tagName || null;
	const activeCollectionId = collectionId || null;
	const activeCollectionName = collectionName || null;

	// Check if any advanced filters are active
	const hasActiveFilters =
		activeQuickFilter !== "all" ||
		activeTagId ||
		activeCollectionId ||
		appliedSearchQuery;

	// Build query params based on all filters
	const queryParams = useMemo((): ListSavesInput => {
		const params: ListSavesInput = { limit: 20 };

		// Quick filter
		if (activeQuickFilter === "favorites") {
			params.isFavorite = true;
		} else if (activeQuickFilter === "public") {
			params.visibility = "public";
		}

		// Search query (local state, not URL)
		if (appliedSearchQuery) {
			params.query = appliedSearchQuery;
		}

		// Tag filter
		if (activeTagId) {
			params.tagId = activeTagId;
		}

		// Collection filter
		if (activeCollectionId) {
			params.collectionId = activeCollectionId;
		}

		return params;
	}, [activeQuickFilter, appliedSearchQuery, activeTagId, activeCollectionId]);

	// Track manual refresh separately from background polling
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);
	// Track if we've ever loaded data (to avoid full-screen loading on filter changes)
	const hasLoadedOnce = useRef(false);

	const {
		data,
		isPending,
		isFetching,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListSaves(queryParams);

	// Mark that we've loaded data at least once
	if (data && !hasLoadedOnce.current) {
		hasLoadedOnce.current = true;
	}

	// Clear all filters
	const clearAllFilters = useCallback(() => {
		router.setParams({
			filter: undefined,
			tagId: undefined,
			tagName: undefined,
			collectionId: undefined,
			collectionName: undefined,
		});
		setSearchInput("");
		setAppliedSearchQuery("");
		setIsSearchExpanded(false);
	}, [router]);

	// Clear just the quick filter
	const clearQuickFilter = useCallback(() => {
		router.setParams({ filter: undefined });
	}, [router]);

	// Clear tag filter
	const clearTagFilter = useCallback(() => {
		router.setParams({ tagId: undefined, tagName: undefined });
	}, [router]);

	// Clear collection filter
	const clearCollectionFilter = useCallback(() => {
		router.setParams({ collectionId: undefined, collectionName: undefined });
	}, [router]);

	// Clear search query
	const clearSearchQuery = useCallback(() => {
		setSearchInput("");
		setAppliedSearchQuery("");
		setIsSearchExpanded(false);
	}, []);

	// Manual refresh handler - shows spinner only for user-initiated refreshes
	const handleManualRefresh = useCallback(async () => {
		setIsManualRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsManualRefreshing(false);
		}
	}, [refetch]);

	// Handle quick filter selection
	const handleQuickFilterSelect = useCallback(
		(filterValue: QuickFilterType) => {
			Haptics.selectionAsync();
			if (filterValue === "all") {
				router.setParams({ filter: undefined });
			} else {
				router.setParams({ filter: filterValue });
			}
		},
		[router],
	);

	// Handle tag selection
	const handleTagSelect = useCallback(
		(tag: Tag) => {
			Haptics.selectionAsync();
			router.setParams({
				tagId: tag.id,
				tagName: tag.name,
			});
			setShowFilterModal(false);
		},
		[router],
	);

	// Handle collection selection
	const handleCollectionSelect = useCallback(
		(collection: Collection) => {
			Haptics.selectionAsync();
			router.setParams({
				collectionId: collection.id,
				collectionName: collection.name,
			});
			setShowFilterModal(false);
		},
		[router],
	);

	// Handle search submission
	const handleSearchSubmit = useCallback(() => {
		Haptics.selectionAsync();
		setAppliedSearchQuery(searchInput.trim());
	}, [searchInput]);

	// Toggle search expansion
	const toggleSearchExpanded = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setIsSearchExpanded((prev) => !prev);
	}, []);

	const openFilterModal = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setShowFilterModal(true);
	}, []);

	const toggleFavorite = useToggleFavorite();
	const toggleArchive = useToggleArchive();

	// Flatten paginated data
	const saves = data?.pages.flatMap((page) => page.items) ?? [];

	// Only show full-screen loading on the very first load ever
	// After that, filter/search changes should show inline loading in the list
	const showInitialLoading = isPending && !data && !hasLoadedOnce.current;

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
		// Don't show empty state while fetching - wait for results
		if (isFetching) return null;

		return (
			<View style={styles.emptyState}>
				<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
					{appliedSearchQuery ? (
						<Search
							size={48}
							color={colors.mutedForeground}
							strokeWidth={1.5}
						/>
					) : activeTagId ? (
						<TagIcon
							size={48}
							color={colors.mutedForeground}
							strokeWidth={1.5}
						/>
					) : activeCollectionId ? (
						<FolderOpen
							size={48}
							color={colors.mutedForeground}
							strokeWidth={1.5}
						/>
					) : activeQuickFilter === "favorites" ? (
						<Star size={48} color={colors.mutedForeground} strokeWidth={1.5} />
					) : (
						<Bookmark
							size={48}
							color={colors.mutedForeground}
							strokeWidth={1.5}
						/>
					)}
				</View>
				<Text style={[styles.emptyTitle, { color: colors.text }]}>
					{appliedSearchQuery
						? "No results found"
						: activeTagId
							? `No saves with "${activeTagName}"`
							: activeCollectionId
								? `No saves in "${activeCollectionName}"`
								: activeQuickFilter === "all"
									? "No saves yet"
									: activeQuickFilter === "favorites"
										? "No favorites yet"
										: "No public saves yet"}
				</Text>
				<Text
					style={[styles.emptyDescription, { color: colors.mutedForeground }]}
				>
					{appliedSearchQuery
						? "Try a different search term or adjust your filters."
						: activeTagId || activeCollectionId
							? "Try a different filter or clear your current selection."
							: activeQuickFilter === "all"
								? "Start saving links by sharing them to Backpocket from any app, or add one manually below."
								: activeQuickFilter === "favorites"
									? "Mark saves as favorites and they'll appear here."
									: "Make saves public and they'll appear here."}
				</Text>
				{!hasActiveFilters && (
					<Button
						onPress={() => router.push("/save/new")}
						style={styles.addButton}
					>
						<Plus size={20} color="#FFFFFF" />
						<Text style={styles.addButtonText}>Add Save</Text>
					</Button>
				)}
				{hasActiveFilters && (
					<Button
						variant="secondary"
						onPress={clearAllFilters}
						style={styles.addButton}
					>
						<Text style={[styles.addButtonText, { color: colors.text }]}>
							Clear Filters
						</Text>
					</Button>
				)}
			</View>
		);
	}, [
		colors,
		router,
		activeQuickFilter,
		appliedSearchQuery,
		activeTagId,
		activeTagName,
		activeCollectionId,
		activeCollectionName,
		hasActiveFilters,
		clearAllFilters,
		isFetching,
	]);

	const renderFooter = useCallback(() => {
		if (!isFetchingNextPage) return null;
		return (
			<View style={styles.footer}>
				<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
			</View>
		);
	}, [isFetchingNextPage]);

	// Show subtle loading indicator when refetching with filters (not initial load)
	const renderHeader = useCallback(() => {
		if (!isFetching || !hasLoadedOnce.current || isManualRefreshing)
			return null;
		return (
			<View style={styles.inlineLoader}>
				<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
				<Text
					style={[styles.inlineLoaderText, { color: colors.mutedForeground }]}
				>
					Searching...
				</Text>
			</View>
		);
	}, [isFetching, isManualRefreshing, colors.mutedForeground]);

	if (showInitialLoading) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" color={brandColors.rust.DEFAULT} />
			</View>
		);
	}

	if (isError) {
		return (
			<View
				style={[
					styles.container,
					styles.centered,
					{ backgroundColor: colors.background },
				]}
			>
				<Text style={[styles.errorText, { color: colors.destructive }]}>
					Failed to load saves
				</Text>
				<Button onPress={() => refetch()} style={{ marginTop: 16 }}>
					Try Again
				</Button>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Filter Bar - Always visible */}
			<View
				style={[
					styles.filterBar,
					{ backgroundColor: colors.card, borderBottomColor: colors.border },
				]}
			>
				<Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
					Showing:
				</Text>

				{/* Active filter chips - scrollable row */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.filterChipsScroll}
					contentContainerStyle={styles.filterChipsContent}
				>
					{/* Quick filter chip */}
					{activeQuickFilter !== "all" ? (
						<TouchableOpacity
							onPress={openFilterModal}
							style={[
								styles.filterChip,
								{ backgroundColor: `${colors.primary}20` },
							]}
							activeOpacity={0.7}
						>
							<Text style={[styles.filterChipText, { color: colors.primary }]}>
								{quickFilterLabels[activeQuickFilter]}
							</Text>
							<TouchableOpacity
								onPress={clearQuickFilter}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<X size={14} color={colors.primary} strokeWidth={2.5} />
							</TouchableOpacity>
						</TouchableOpacity>
					) : !activeTagId && !activeCollectionId && !appliedSearchQuery ? (
						<TouchableOpacity
							onPress={openFilterModal}
							style={[styles.filterChip, { backgroundColor: colors.muted }]}
							activeOpacity={0.7}
						>
							<Text style={[styles.filterChipText, { color: colors.text }]}>
								All Saves
							</Text>
						</TouchableOpacity>
					) : null}

					{/* Tag filter chip */}
					{activeTagId && activeTagName && (
						<TouchableOpacity
							onPress={openFilterModal}
							style={[
								styles.filterChip,
								{ backgroundColor: `${brandColors.denim.DEFAULT}20` },
							]}
							activeOpacity={0.7}
						>
							<TagIcon size={12} color={brandColors.denim.deep} />
							<Text
								style={[
									styles.filterChipText,
									{ color: brandColors.denim.deep },
								]}
							>
								{activeTagName}
							</Text>
							<TouchableOpacity
								onPress={clearTagFilter}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<X size={14} color={brandColors.denim.deep} strokeWidth={2.5} />
							</TouchableOpacity>
						</TouchableOpacity>
					)}

					{/* Collection filter chip */}
					{activeCollectionId && activeCollectionName && (
						<TouchableOpacity
							onPress={openFilterModal}
							style={[
								styles.filterChip,
								{ backgroundColor: `${brandColors.teal}20` },
							]}
							activeOpacity={0.7}
						>
							<FolderOpen size={12} color={brandColors.teal} />
							<Text
								style={[styles.filterChipText, { color: brandColors.teal }]}
							>
								{activeCollectionName}
							</Text>
							<TouchableOpacity
								onPress={clearCollectionFilter}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<X size={14} color={brandColors.teal} strokeWidth={2.5} />
							</TouchableOpacity>
						</TouchableOpacity>
					)}

					{/* Search query chip */}
					{appliedSearchQuery && (
						<TouchableOpacity
							onPress={toggleSearchExpanded}
							style={[
								styles.filterChip,
								{ backgroundColor: `${brandColors.rust.DEFAULT}20` },
							]}
							activeOpacity={0.7}
						>
							<Search size={12} color={brandColors.rust.DEFAULT} />
							<Text
								style={[
									styles.filterChipText,
									{ color: brandColors.rust.DEFAULT },
								]}
								numberOfLines={1}
							>
								"{appliedSearchQuery}"
							</Text>
							<TouchableOpacity
								onPress={clearSearchQuery}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<X
									size={14}
									color={brandColors.rust.DEFAULT}
									strokeWidth={2.5}
								/>
							</TouchableOpacity>
						</TouchableOpacity>
					)}
				</ScrollView>

				{/* Search toggle button */}
				<TouchableOpacity
					onPress={toggleSearchExpanded}
					style={[
						styles.filterButton,
						{
							backgroundColor: isSearchExpanded
								? `${brandColors.rust.DEFAULT}20`
								: colors.muted,
						},
					]}
					activeOpacity={0.7}
				>
					<Search
						size={18}
						color={
							isSearchExpanded
								? brandColors.rust.DEFAULT
								: colors.mutedForeground
						}
					/>
				</TouchableOpacity>

				{/* Filter button */}
				<TouchableOpacity
					onPress={openFilterModal}
					style={[
						styles.filterButton,
						{
							backgroundColor: hasActiveFilters
								? `${colors.primary}20`
								: colors.muted,
						},
					]}
					activeOpacity={0.7}
				>
					<Filter
						size={18}
						color={hasActiveFilters ? colors.primary : colors.mutedForeground}
					/>
				</TouchableOpacity>
			</View>

			{/* Search Input - Expandable */}
			{isSearchExpanded && (
				<View
					style={[
						styles.searchContainer,
						{ backgroundColor: colors.card, borderBottomColor: colors.border },
					]}
				>
					<View
						style={[
							styles.searchInputWrapper,
							{
								backgroundColor: colors.background,
								borderColor: colors.border,
							},
						]}
					>
						<Search size={18} color={colors.mutedForeground} />
						<TextInput
							style={[styles.searchInput, { color: colors.text }]}
							placeholder="Search saves..."
							placeholderTextColor={colors.mutedForeground}
							value={searchInput}
							onChangeText={setSearchInput}
							onSubmitEditing={handleSearchSubmit}
							returnKeyType="search"
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{searchInput.length > 0 && (
							<TouchableOpacity
								onPress={() => setSearchInput("")}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<X size={18} color={colors.mutedForeground} />
							</TouchableOpacity>
						)}
					</View>
					<TouchableOpacity
						onPress={toggleSearchExpanded}
						style={[styles.collapseButton, { backgroundColor: colors.muted }]}
						activeOpacity={0.7}
					>
						<ChevronUp size={18} color={colors.mutedForeground} />
					</TouchableOpacity>
				</View>
			)}

			{/* Filter Selection Modal - Bottom Sheet Style */}
			<Modal
				visible={showFilterModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowFilterModal(false)}
			>
				<Pressable
					style={styles.modalOverlay}
					onPress={() => setShowFilterModal(false)}
				>
					<Pressable
						style={[styles.bottomSheet, { backgroundColor: colors.card }]}
						onPress={(e) => e.stopPropagation()}
					>
						{/* Handle indicator */}
						<View style={styles.bottomSheetHandle}>
							<View
								style={[
									styles.handleIndicator,
									{ backgroundColor: colors.border },
								]}
							/>
						</View>

						{/* Header */}
						<View
							style={[styles.modalHeader, { borderBottomColor: colors.border }]}
						>
							<Text style={[styles.modalTitle, { color: colors.text }]}>
								Filters
							</Text>
							<TouchableOpacity
								onPress={() => setShowFilterModal(false)}
								style={styles.modalCloseButton}
							>
								<X size={20} color={colors.mutedForeground} />
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.bottomSheetScroll}
							showsVerticalScrollIndicator={false}
						>
							{/* Quick Filters Section */}
							<View style={styles.filterSection}>
								<View style={styles.filterOptions}>
									{quickFilterOptions.map((option) => {
										const isActive = activeQuickFilter === option.value;
										const IconComponent = option.icon;
										return (
											<TouchableOpacity
												key={option.value}
												style={[
													styles.filterOption,
													{ borderColor: colors.border },
													isActive && {
														backgroundColor: `${colors.primary}15`,
														borderColor: colors.primary,
													},
												]}
												onPress={() => handleQuickFilterSelect(option.value)}
												activeOpacity={0.7}
											>
												<View
													style={[
														styles.filterOptionIcon,
														{
															backgroundColor: isActive
																? `${colors.primary}20`
																: colors.muted,
														},
													]}
												>
													<IconComponent
														size={18}
														color={
															isActive ? colors.primary : colors.mutedForeground
														}
													/>
												</View>
												<Text
													style={[
														styles.filterOptionText,
														{ color: isActive ? colors.primary : colors.text },
													]}
												>
													{option.label}
												</Text>
												{isActive && (
													<Check
														size={20}
														color={colors.primary}
														strokeWidth={2.5}
													/>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</View>

							{/* Divider */}
							<View
								style={[
									styles.sectionDivider,
									{ backgroundColor: colors.border },
								]}
							/>

							{/* Tags Section */}
							<View style={styles.filterSection}>
								<View style={styles.sectionHeader}>
									<TagIcon size={16} color={colors.primary} />
									<Text
										style={[styles.sectionTitle, { color: colors.primary }]}
									>
										Tags
									</Text>
								</View>
								{tags &&
								tags.filter((t) => (t._count?.saves ?? 0) > 0).length > 0 ? (
									<View style={styles.tagsList}>
										{tags
											.filter((t) => (t._count?.saves ?? 0) > 0)
											.map((tag) => {
												const isActive = activeTagId === tag.id;
												return (
													<TouchableOpacity
														key={tag.id}
														style={[
															styles.tagItem,
															{ backgroundColor: colors.muted },
															isActive && {
																backgroundColor: `${brandColors.denim.DEFAULT}20`,
															},
														]}
														onPress={() => handleTagSelect(tag)}
														activeOpacity={0.7}
													>
														<Text
															style={[
																styles.tagItemText,
																{ color: colors.text },
																isActive && { color: brandColors.denim.deep },
															]}
															numberOfLines={1}
														>
															{tag.name}
														</Text>
														{tag._count && (
															<Text
																style={[
																	styles.tagItemCount,
																	{ color: colors.mutedForeground },
																	isActive && { color: brandColors.denim.deep },
																]}
															>
																{tag._count.saves}
															</Text>
														)}
													</TouchableOpacity>
												);
											})}
									</View>
								) : (
									<Text
										style={[
											styles.emptyFilterText,
											{ color: colors.mutedForeground },
										]}
									>
										No tags yet
									</Text>
								)}
							</View>

							{/* Divider */}
							<View
								style={[
									styles.sectionDivider,
									{ backgroundColor: colors.border },
								]}
							/>

							{/* Collections Section */}
							<View style={styles.filterSection}>
								<View style={styles.sectionHeader}>
									<FolderOpen size={16} color={colors.primary} />
									<Text
										style={[styles.sectionTitle, { color: colors.primary }]}
									>
										Collections
									</Text>
								</View>
								{collections &&
								collections.filter((c) => (c._count?.saves ?? 0) > 0).length >
									0 ? (
									<View style={styles.collectionsList}>
										{collections
											.filter((c) => (c._count?.saves ?? 0) > 0)
											.map((collection) => {
												const isActive = activeCollectionId === collection.id;
												return (
													<TouchableOpacity
														key={collection.id}
														style={[
															styles.collectionItem,
															isActive && {
																backgroundColor: `${brandColors.teal}15`,
															},
														]}
														onPress={() => handleCollectionSelect(collection)}
														activeOpacity={0.7}
													>
														<Text
															style={[
																styles.collectionItemText,
																{ color: colors.text },
																isActive && { color: brandColors.teal },
															]}
															numberOfLines={1}
														>
															{collection.name}
														</Text>
														{collection._count && (
															<Text
																style={[
																	styles.collectionItemCount,
																	{ color: colors.mutedForeground },
																	isActive && { color: brandColors.teal },
																]}
															>
																{collection._count.saves}
															</Text>
														)}
													</TouchableOpacity>
												);
											})}
									</View>
								) : (
									<Text
										style={[
											styles.emptyFilterText,
											{ color: colors.mutedForeground },
										]}
									>
										No collections yet
									</Text>
								)}
							</View>

							{/* Clear All Button */}
							{hasActiveFilters && (
								<View style={styles.clearAllContainer}>
									<Button
										variant="secondary"
										onPress={() => {
											clearAllFilters();
											setShowFilterModal(false);
										}}
										style={styles.clearAllButton}
									>
										<X size={16} color={colors.text} />
										<Text style={[styles.clearAllText, { color: colors.text }]}>
											Clear All Filters
										</Text>
									</Button>
								</View>
							)}

							{/* Bottom spacing */}
							<View style={{ height: 40 }} />
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>

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
						onRefresh={handleManualRefresh}
						tintColor={brandColors.rust.DEFAULT}
					/>
				}
			/>

			{/* FAB for adding saves */}
			{saves.length > 0 && (
				<TouchableOpacity
					style={[styles.fab, { backgroundColor: brandColors.rust.DEFAULT }]}
					onPress={() => router.push("/save/new")}
					activeOpacity={0.8}
				>
					<Plus size={24} color="#FFFFFF" />
				</TouchableOpacity>
			)}
		</View>
	);
}

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
	const handleOpenUrl = () => {
		onOpenUrl(save.url);
	};

	return (
		<Card style={styles.saveCard}>
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{/* Image preview if available */}
				{save.imageUrl && (
					<Image
						source={{ uri: save.imageUrl }}
						style={styles.saveImage}
						resizeMode="cover"
					/>
				)}

				<View style={styles.saveContent}>
					{/* Site info */}
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
								<Text
									style={[styles.visibilityText, { color: brandColors.mint }]}
								>
									Public
								</Text>
							</View>
						)}
					</View>

					{/* Title */}
					<Text
						style={[styles.saveTitle, { color: colors.text }]}
						numberOfLines={2}
					>
						{save.title || save.url}
					</Text>

					{/* Description */}
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

					{/* Tags */}
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

			{/* Actions */}
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
					onPress={handleOpenUrl}
					style={styles.actionButton}
					activeOpacity={0.7}
				>
					<ExternalLink size={20} color={colors.mutedForeground} />
				</TouchableOpacity>
			</View>
		</Card>
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
	filterBar: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		gap: 8,
	},
	filterLabel: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	filterChipsScroll: {
		flex: 1,
	},
	filterChipsContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	filterChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: radii.full,
		gap: 6,
		maxWidth: 150,
	},
	filterChipText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		flexShrink: 1,
	},
	filterButton: {
		width: 36,
		height: 36,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	// Search input styles
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		gap: 10,
	},
	searchInputWrapper: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		height: 40,
		borderRadius: radii.md,
		borderWidth: 1,
		paddingHorizontal: 12,
		gap: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 15,
		fontFamily: "DMSans",
		height: "100%",
	},
	collapseButton: {
		width: 36,
		height: 36,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	// Bottom sheet modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "transparent",
		justifyContent: "flex-end",
	},
	bottomSheet: {
		borderTopLeftRadius: radii.xl,
		borderTopRightRadius: radii.xl,
		minHeight: "50%",
		maxHeight: "85%",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
		elevation: 16,
	},
	bottomSheetHandle: {
		alignItems: "center",
		paddingTop: 12,
		paddingBottom: 8,
	},
	handleIndicator: {
		width: 36,
		height: 4,
		borderRadius: 2,
	},
	bottomSheetScroll: {
		flexGrow: 1,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	modalTitle: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
	},
	modalCloseButton: {
		padding: 4,
	},
	filterSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	sectionDivider: {
		height: StyleSheet.hairlineWidth,
		marginHorizontal: 20,
	},
	filterOptions: {
		gap: 10,
	},
	filterOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: radii.lg,
		borderWidth: 1,
		gap: 12,
	},
	filterOptionIcon: {
		width: 36,
		height: 36,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	filterOptionText: {
		flex: 1,
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	// Tags list styles
	tagsList: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tagItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: radii.md,
		gap: 8,
	},
	tagItemText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	tagItemCount: {
		fontSize: 12,
		fontFamily: "DMSans",
	},
	// Collections list styles
	collectionsList: {
		gap: 4,
	},
	collectionItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderRadius: radii.md,
	},
	collectionItemText: {
		flex: 1,
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	collectionItemCount: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginLeft: 8,
	},
	emptyFilterText: {
		fontSize: 14,
		fontFamily: "DMSans",
		fontStyle: "italic",
	},
	clearAllContainer: {
		paddingHorizontal: 20,
		paddingTop: 16,
	},
	clearAllButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	clearAllText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	listContent: {
		padding: 16,
		gap: 16,
	},
	emptyContainer: {
		flexGrow: 1,
		justifyContent: "center",
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		padding: 32,
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
		marginBottom: 24,
	},
	addButton: {
		flexDirection: "row",
		gap: 8,
	},
	addButtonText: {
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
	footer: {
		paddingVertical: 20,
		alignItems: "center",
	},
	inlineLoader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		gap: 8,
	},
	inlineLoaderText: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	fab: {
		position: "absolute",
		right: 20,
		bottom: 20,
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	},
	saveCard: {
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
	visibilityText: {
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
});
