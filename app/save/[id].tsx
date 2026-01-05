/**
 * Save Detail Screen
 * Shows a single save with all its details and actions
 */

import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
	Archive,
	BookOpen,
	ChevronLeft,
	ExternalLink,
	Eye,
	EyeOff,
	FolderOpen,
	Star,
	Tag,
	Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

const HEADER_BUTTON_SIZE = 36;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	useDeleteSave,
	useGetSave,
	useToggleArchive,
	useToggleFavorite,
} from "@/lib/api/saves";
import { isSaveProcessing } from "@/lib/api/use-processing-saves";

export default function SaveDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const colors = useThemeColors();

	const { data: save, isLoading, isError } = useGetSave(id);
	const toggleFavorite = useToggleFavorite();
	const toggleArchive = useToggleArchive();
	const deleteSave = useDeleteSave();

	const [isDeleting, setIsDeleting] = useState(false);

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
		Linking.openURL(save.url);
	}, [save]);

	const _handleShare = useCallback(async () => {
		if (!save) return;
		try {
			if (await Sharing.isAvailableAsync()) {
				// Note: Sharing.shareAsync is for files, use native share for URLs
				// For URL sharing, we'll use Linking for now
				Linking.openURL(`sms:&body=${encodeURIComponent(save.url)}`);
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
						<TouchableOpacity
							onPress={handleOpenUrl}
							style={styles.headerButton}
						>
							<ExternalLink size={20} color={colors.text} />
						</TouchableOpacity>
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
				{save.tags && save.tags.length > 0 && (
					<Card style={styles.section}>
						<CardContent>
							<View style={styles.sectionHeader}>
								<Tag size={18} color={colors.mutedForeground} />
								<Text style={[styles.sectionTitle, { color: colors.text }]}>
									Tags
								</Text>
							</View>
							<View style={styles.tags}>
								{save.tags.map((tag) => (
									<View
										key={tag.id}
										style={[
											styles.tag,
											{ backgroundColor: `${brandColors.denim.DEFAULT}15` },
										]}
									>
										<Text
											style={[
												styles.tagText,
												{ color: brandColors.denim.deep },
											]}
										>
											{tag.name}
										</Text>
									</View>
								))}
							</View>
						</CardContent>
					</Card>
				)}

				{/* Collections */}
				{save.collections && save.collections.length > 0 && (
					<Card style={styles.section}>
						<CardContent>
							<View style={styles.sectionHeader}>
								<FolderOpen size={18} color={colors.mutedForeground} />
								<Text style={[styles.sectionTitle, { color: colors.text }]}>
									Collections
								</Text>
							</View>
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
						</CardContent>
					</Card>
				)}

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
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: radii.sm,
	},
	tagText: {
		fontSize: 13,
		fontFamily: "DMSans-Medium",
	},
	collections: {
		gap: 8,
	},
	collection: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: radii.sm,
	},
	collectionText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
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
