import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Archive,
	Bookmark,
	ExternalLink,
	Heart,
	Plus,
	X,
} from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	useListSaves,
	useToggleArchive,
	useToggleFavorite,
} from "@/lib/api/saves";
import type { ListSavesInput, Save } from "@/lib/api/types";

type FilterType = "all" | "favorites" | "public";

const filterLabels: Record<FilterType, string> = {
	all: "All Saves",
	favorites: "Favorites",
	public: "Public",
};

export default function SavesScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const { filter } = useLocalSearchParams<{ filter?: FilterType }>();
	
	const activeFilter: FilterType = filter || "all";
	
	// Build query params based on filter
	const queryParams = useMemo((): ListSavesInput => {
		const params: ListSavesInput = { limit: 20 };
		if (activeFilter === "favorites") {
			params.isFavorite = true;
		} else if (activeFilter === "public") {
			params.visibility = "public";
		}
		return params;
	}, [activeFilter]);

	const {
		data,
		isLoading,
		isError,
		refetch,
		isRefetching,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListSaves(queryParams);
	
	const clearFilter = useCallback(() => {
		router.setParams({ filter: undefined });
	}, [router]);

	const toggleFavorite = useToggleFavorite();
	const toggleArchive = useToggleArchive();

	// Flatten paginated data
	const saves = data?.pages.flatMap((page) => page.items) ?? [];

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
			/>
		),
		[colors, router, handleToggleFavorite, handleToggleArchive],
	);

	const renderEmpty = useCallback(
		() => (
			<View style={styles.emptyState}>
				<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
					{activeFilter === "favorites" ? (
						<Heart size={48} color={colors.mutedForeground} strokeWidth={1.5} />
					) : (
						<Bookmark size={48} color={colors.mutedForeground} strokeWidth={1.5} />
					)}
				</View>
				<Text style={[styles.emptyTitle, { color: colors.text }]}>
					{activeFilter === "all" 
						? "No saves yet" 
						: activeFilter === "favorites"
						? "No favorites yet"
						: "No public saves yet"}
				</Text>
				<Text
					style={[styles.emptyDescription, { color: colors.mutedForeground }]}
				>
					{activeFilter === "all" 
						? "Start saving links by sharing them to Backpocket from any app, or add one manually below."
						: activeFilter === "favorites"
						? "Mark saves as favorites and they'll appear here."
						: "Make saves public and they'll appear here."}
				</Text>
				{activeFilter === "all" && (
					<Button
						onPress={() => router.push("/save/new")}
						style={styles.addButton}
					>
						<Plus size={20} color="#FFFFFF" />
						<Text style={styles.addButtonText}>Add Save</Text>
					</Button>
				)}
				{activeFilter !== "all" && (
					<Button
						variant="secondary"
						onPress={clearFilter}
						style={styles.addButton}
					>
						<Text style={[styles.addButtonText, { color: colors.text }]}>View All Saves</Text>
					</Button>
				)}
			</View>
		),
		[colors, router, activeFilter, clearFilter],
	);

	const renderFooter = useCallback(() => {
		if (!isFetchingNextPage) return null;
		return (
			<View style={styles.footer}>
				<ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
			</View>
		);
	}, [isFetchingNextPage]);

	if (isLoading) {
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
			{/* Active Filter Indicator */}
			{activeFilter !== "all" && (
				<View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
					<Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
						Showing:
					</Text>
					<View style={[styles.filterChip, { backgroundColor: colors.primary + "20" }]}>
						<Text style={[styles.filterChipText, { color: colors.primary }]}>
							{filterLabels[activeFilter]}
						</Text>
						<TouchableOpacity onPress={clearFilter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
							<X size={14} color={colors.primary} strokeWidth={2.5} />
						</TouchableOpacity>
					</View>
				</View>
			)}
			
			<FlatList
				data={saves}
				renderItem={renderItem}
				keyExtractor={(item) => item.id}
				contentContainerStyle={
					saves.length === 0 ? styles.emptyContainer : styles.listContent
				}
				ListEmptyComponent={renderEmpty}
				ListFooterComponent={renderFooter}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
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
}

function SaveCard({
	save,
	colors,
	onPress,
	onToggleFavorite,
	onToggleArchive,
}: SaveCardProps) {
	const handleOpenUrl = () => {
		Linking.openURL(save.url);
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
					<Heart
						size={20}
						color={
							save.isFavorite
								? brandColors.rust.DEFAULT
								: colors.mutedForeground
						}
						fill={save.isFavorite ? brandColors.rust.DEFAULT : "transparent"}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={onToggleArchive}
					style={styles.actionButton}
					activeOpacity={0.7}
				>
					<Archive
						size={20}
						color={
							save.isArchived
								? brandColors.denim.DEFAULT
								: colors.mutedForeground
						}
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
	filterChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: radii.full,
		gap: 6,
	},
	filterChipText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	listContent: {
		padding: 16,
		gap: 16,
	},
	emptyContainer: {
		flex: 1,
	},
	emptyState: {
		flex: 1,
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
