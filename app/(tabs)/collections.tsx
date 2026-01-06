import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight, FolderOpen, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
	Alert,
	FlatList,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useDeleteCollection, useListCollections } from "@/lib/api/collections";
import type { Collection } from "@/lib/api/types";

export default function CollectionsScreen() {
	const colors = useThemeColors();
	const router = useRouter();

	// Data fetching
	const { data: collections, isPending, refetch } = useListCollections();

	// Mutations
	const deleteCollection = useDeleteCollection();

	// Manual refresh handler
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);
	const handleRefresh = useCallback(async () => {
		setIsManualRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsManualRefreshing(false);
		}
	}, [refetch]);

	// Navigate to create collection form
	const handleCreateCollection = useCallback(() => {
		router.push("/collection/new");
	}, [router]);

	// Delete collection handler
	const handleDeleteCollection = useCallback(
		(collection: Collection) => {
			Alert.alert(
				"Delete Collection",
				`Are you sure you want to delete "${collection.name}"? This cannot be undone. Saves in this collection will not be deleted.`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Delete",
						style: "destructive",
						onPress: () => {
							Haptics.notificationAsync(
								Haptics.NotificationFeedbackType.Warning,
							);
							deleteCollection.mutate(collection.id, {
								onError: () => {
									Alert.alert("Error", "Failed to delete collection");
								},
							});
						},
					},
				],
			);
		},
		[deleteCollection],
	);

	// Navigate to collection detail view
	const handleCollectionPress = useCallback(
		(collection: Collection) => {
			router.push(`/collection/${collection.id}`);
		},
		[router],
	);

	// Render collection item
	const renderCollectionItem = useCallback(
		({ item }: { item: Collection }) => {
			const saveCount = item._count?.saves ?? 0;
			const isOptimistic = item.id.startsWith("temp-");

			return (
				<Pressable
					style={({ pressed }) => [
						styles.collectionItem,
						{
							backgroundColor: pressed ? colors.muted : colors.card,
							opacity: isOptimistic ? 0.7 : 1,
						},
					]}
					onPress={() => !isOptimistic && handleCollectionPress(item)}
					disabled={isOptimistic}
				>
					<View style={styles.collectionInfo}>
						<View
							style={[styles.collectionIcon, { backgroundColor: colors.muted }]}
						>
							<FolderOpen
								size={20}
								color={brandColors.amber}
								strokeWidth={1.5}
							/>
						</View>
						<View style={styles.collectionDetails}>
							<Text
								style={[styles.collectionName, { color: colors.text }]}
								numberOfLines={1}
							>
								{item.name}
							</Text>
							<Text
								style={[
									styles.collectionCount,
									{ color: colors.mutedForeground },
								]}
							>
								{saveCount} {saveCount === 1 ? "save" : "saves"}
							</Text>
						</View>
					</View>
					<View style={styles.collectionActions}>
						{!isOptimistic && (
							<Pressable
								style={({ pressed }) => [
									styles.deleteButton,
									pressed && { opacity: 0.5 },
								]}
								onPress={() => handleDeleteCollection(item)}
								hitSlop={8}
							>
								<Trash2
									size={18}
									color={colors.mutedForeground}
									strokeWidth={2}
								/>
							</Pressable>
						)}
						<ChevronRight
							size={20}
							color={colors.mutedForeground}
							strokeWidth={2}
						/>
					</View>
				</Pressable>
			);
		},
		[colors, handleCollectionPress, handleDeleteCollection],
	);

	// Empty state component
	const EmptyState = () => (
		<View style={styles.emptyState}>
			<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
				<FolderOpen
					size={48}
					color={colors.mutedForeground}
					strokeWidth={1.5}
				/>
			</View>
			<Text style={[styles.emptyTitle, { color: colors.text }]}>
				No collections
			</Text>
			<Text
				style={[styles.emptyDescription, { color: colors.mutedForeground }]}
			>
				Create collections to organize your saves into groups.
			</Text>
			<Button style={styles.addButton} onPress={handleCreateCollection}>
				<Plus size={20} color="#FFFFFF" />
				<Text style={styles.addButtonText}>Create Collection</Text>
			</Button>
		</View>
	);

	// Loading state
	if (isPending && !collections) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.loadingContainer}>
					<Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
						Loading collections...
					</Text>
				</View>
			</View>
		);
	}

	const hasCollections = collections && collections.length > 0;

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{hasCollections ? (
				<FlatList
					data={collections}
					keyExtractor={(item) => item.id}
					renderItem={renderCollectionItem}
					contentContainerStyle={styles.listContent}
					ItemSeparatorComponent={() => (
						<View
							style={[styles.separator, { backgroundColor: colors.border }]}
						/>
					)}
					refreshControl={
						<RefreshControl
							refreshing={isManualRefreshing}
							onRefresh={handleRefresh}
							tintColor={colors.primary}
						/>
					}
					ListHeaderComponent={
						<View style={styles.headerActions}>
							<Button size="sm" onPress={handleCreateCollection}>
								<Plus size={16} color="#FFFFFF" />
								<Text style={styles.headerButtonText}>New Collection</Text>
							</Button>
						</View>
					}
				/>
			) : (
				<EmptyState />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		fontSize: 15,
		fontFamily: "DMSans",
	},
	listContent: {
		paddingBottom: 32,
	},
	headerActions: {
		padding: 16,
		paddingBottom: 8,
	},
	headerButtonText: {
		color: "#FFFFFF",
		fontSize: 13,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	collectionItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	collectionInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		gap: 12,
	},
	collectionIcon: {
		width: 40,
		height: 40,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	collectionDetails: {
		flex: 1,
	},
	collectionName: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 2,
	},
	collectionCount: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	collectionActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	deleteButton: {
		padding: 4,
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 68,
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
});
