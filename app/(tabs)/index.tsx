import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
	Bookmark,
	ChevronRight,
	ExternalLink,
	FolderOpen,
	Globe,
	Heart,
	Plus,
} from "lucide-react-native";
import {
	Alert,
	Image,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { SwipeableRow } from "@/components/ui/swipeable-row";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useDeleteSave, useToggleArchive, useToggleFavorite } from "@/lib/api/saves";
import { useDashboard } from "@/lib/api/space";
import type { Save } from "@/lib/api/types";

export default function DashboardScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	// Always call useUser hook (React rules of hooks)
	const { user } = useUser();
	const userName = user?.firstName || "there";
	const userImageUrl = user?.imageUrl;

	// Fetch dashboard data
	const {
		data: dashboard,
		isLoading,
		isError,
		refetch,
		isRefetching,
	} = useDashboard();

	// Mutations for swipe actions
	const deleteSave = useDeleteSave();
	const toggleArchive = useToggleArchive();
	const toggleFavorite = useToggleFavorite();

	const stats = dashboard?.stats;
	// Filter out archived items from recent saves - they shouldn't appear here
	const recentSaves = (dashboard?.recentSaves || []).filter(
		(save) => !save.isArchived
	);

	const handleDeleteSave = (saveId: string) => {
		deleteSave.mutate(saveId);
	};

	const handleArchiveSave = (saveId: string) => {
		// Always archive (set to true) since we filter out archived items
		toggleArchive.mutate({ saveId, value: true });
	};

	const handleFavoriteSave = (saveId: string, currentlyFavorite: boolean) => {
		toggleFavorite.mutate({ saveId, value: !currentlyFavorite });
	};

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={[
				styles.content,
				{ paddingBottom: 24 + insets.bottom },
			]}
			showsVerticalScrollIndicator={false}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={refetch}
					tintColor={brandColors.rust.DEFAULT}
				/>
			}
		>
			{/* Header */}
			<View style={styles.header}>
				{userImageUrl ? (
					<Image source={{ uri: userImageUrl }} style={styles.profileImage} />
				) : (
					<View
						style={[
							styles.profilePlaceholder,
							{ backgroundColor: colors.muted },
						]}
					>
						<Text style={[styles.profileInitial, { color: colors.text }]}>
							{userName.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}
				<View style={styles.greeting}>
					<Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
						Welcome back,
					</Text>
					<Text style={[styles.userName, { color: colors.text }]}>
						{userName}
					</Text>
				</View>
			</View>

			{/* Stats Grid - 2x2 compact layout */}
			<View style={styles.statsContainer}>
				<View style={styles.statsRow}>
					<StatCard
						title="Saves"
						value={isLoading ? "—" : String(stats?.totalSaves ?? 0)}
						icon={Bookmark}
						iconColor={brandColors.teal}
						colors={colors}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push("/(tabs)/saves");
						}}
					/>
					<StatCard
						title="Favorites"
						value={isLoading ? "—" : String(stats?.favoriteSaves ?? 0)}
						icon={Heart}
						iconColor={brandColors.rust.DEFAULT}
						colors={colors}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push({
								pathname: "/(tabs)/saves",
								params: { filter: "favorites" },
							});
						}}
					/>
				</View>
				<View style={styles.statsRow}>
					<StatCard
						title="Public"
						value={isLoading ? "—" : String(stats?.publicSaves ?? 0)}
						icon={Globe}
						iconColor={brandColors.mint}
						colors={colors}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push({
								pathname: "/(tabs)/saves",
								params: { filter: "public" },
							});
						}}
					/>
					<StatCard
						title="Collections"
						value={isLoading ? "—" : String(stats?.totalCollections ?? 0)}
						icon={FolderOpen}
						iconColor={brandColors.amber}
						colors={colors}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							router.push("/(tabs)/collections");
						}}
					/>
				</View>
			</View>

			{/* Quick Add Button */}
			<Button
				onPress={() => router.push("/save/new")}
				size="lg"
				style={styles.quickAddButton}
			>
				<Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
				<Text style={styles.quickAddText}>Add New Save</Text>
			</Button>

			{/* Recent Saves Section */}
			<View style={styles.sectionContainer}>
				<View style={styles.sectionHeader}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
						Recent Saves
					</Text>
					{recentSaves.length > 0 && (
						<TouchableOpacity
							onPress={() => router.push("/(tabs)/saves")}
							style={styles.viewAllButton}
							activeOpacity={0.7}
						>
							<Text style={[styles.viewAllText, { color: colors.primary }]}>
								View all
							</Text>
							<ChevronRight size={16} color={colors.primary} />
						</TouchableOpacity>
					)}
				</View>

				<View
					style={[
						styles.recentCard,
						{ backgroundColor: colors.card, borderColor: colors.border },
					]}
				>
					{isLoading && (
						<View style={styles.emptyContainer}>
							<Text
								style={[styles.emptyText, { color: colors.mutedForeground }]}
							>
								Loading...
							</Text>
						</View>
					)}

					{isError && (
						<View style={styles.emptyContainer}>
							<Text style={[styles.emptyText, { color: colors.destructive }]}>
								Failed to load saves
							</Text>
						</View>
					)}

					{!isLoading && !isError && recentSaves.length === 0 && (
						<View style={styles.emptyContainer}>
							<View
								style={[styles.emptyIcon, { backgroundColor: colors.muted }]}
							>
								<Bookmark size={28} color={colors.mutedForeground} />
							</View>
							<Text style={[styles.emptyTitle, { color: colors.text }]}>
								No saves yet
							</Text>
							<Text
								style={[styles.emptyText, { color: colors.mutedForeground }]}
							>
								Share a link to Backpocket to get started!
							</Text>
						</View>
					)}

				{!isLoading && recentSaves.length > 0 && (
					<GestureHandlerRootView style={styles.savesList}>
						{recentSaves.slice(0, 5).map((save, index) => (
							<SaveListItem
								key={save.id}
								save={save}
								colors={colors}
								isLast={index === Math.min(recentSaves.length, 5) - 1}
								onPress={() => router.push(`/save/${save.id}`)}
								onDelete={() => handleDeleteSave(save.id)}
								onArchive={() => handleArchiveSave(save.id)}
								onFavorite={() => handleFavoriteSave(save.id, save.isFavorite)}
							/>
						))}
					</GestureHandlerRootView>
				)}
				</View>
			</View>
		</ScrollView>
	);
}

interface StatCardProps {
	title: string;
	value: string;
	icon: React.ComponentType<{
		size: number;
		color: string;
		strokeWidth?: number;
	}>;
	iconColor: string;
	colors: ReturnType<typeof useThemeColors>;
	onPress?: () => void;
}

function StatCard({
	title,
	value,
	icon: Icon,
	iconColor,
	colors,
	onPress,
}: StatCardProps) {
	return (
		<TouchableOpacity
			style={[
				styles.statCard,
				{ backgroundColor: colors.card, borderColor: colors.border },
			]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View
				style={[
					styles.statIconContainer,
					{ backgroundColor: `${iconColor}20` },
				]}
			>
				<Icon size={18} color={iconColor} strokeWidth={2} />
			</View>
			<View style={styles.statTextContainer}>
				<Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
				<Text style={[styles.statTitle, { color: colors.mutedForeground }]}>
					{title}
				</Text>
			</View>
			<ChevronRight
				size={16}
				color={colors.mutedForeground}
				style={styles.statChevron}
			/>
		</TouchableOpacity>
	);
}

interface SaveListItemProps {
	save: Save;
	colors: ReturnType<typeof useThemeColors>;
	isLast?: boolean;
	onPress: () => void;
	onDelete: () => void;
	onArchive: () => void;
	onFavorite: () => void;
}

function SaveListItem({
	save,
	colors,
	isLast,
	onPress,
	onDelete,
	onArchive,
	onFavorite,
}: SaveListItemProps) {
	const handleOpenUrl = () => {
		Linking.openURL(save.url);
	};

	const handleDelete = () => {
		Alert.alert(
			"Delete Save",
			"Are you sure you want to delete this save? This cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
						onDelete();
					},
				},
			]
		);
	};

	const handleArchive = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onArchive();
	};

	const handleFavorite = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onFavorite();
	};

	return (
		<SwipeableRow
			onPress={onPress}
			onDelete={handleDelete}
			onArchive={handleArchive}
			onFavorite={handleFavorite}
			isArchived={save.isArchived}
			isFavorite={save.isFavorite}
		>
			<View
				style={[
					styles.saveItem,
					{ backgroundColor: colors.card },
					!isLast && {
						borderBottomColor: colors.border,
						borderBottomWidth: StyleSheet.hairlineWidth,
					},
				]}
			>
				<View style={[styles.saveIcon, { backgroundColor: colors.muted }]}>
					<Bookmark size={18} color={colors.mutedForeground} />
				</View>
				<View style={styles.saveContent}>
					<Text
						style={[styles.saveTitle, { color: colors.text }]}
						numberOfLines={1}
					>
						{save.title || save.url}
					</Text>
					<Text
						style={[styles.saveUrl, { color: colors.mutedForeground }]}
						numberOfLines={1}
					>
						{save.siteName || new URL(save.url).hostname}
					</Text>
				</View>
				<TouchableOpacity
					onPress={handleOpenUrl}
					style={styles.saveAction}
					activeOpacity={0.6}
				>
					<ExternalLink size={20} color={colors.mutedForeground} />
				</TouchableOpacity>
			</View>
		</SwipeableRow>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 20,
		paddingTop: 12,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		marginBottom: 32,
		paddingTop: 8,
	},
	profileImage: {
		width: 52,
		height: 52,
		borderRadius: 26,
	},
	profilePlaceholder: {
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
	},
	profileInitial: {
		fontSize: 22,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
	},
	greeting: {
		flex: 1,
	},
	welcomeText: {
		fontSize: 15,
		fontFamily: "DMSans",
		marginBottom: 2,
	},
	userName: {
		fontSize: 26,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		letterSpacing: -0.5,
	},
	statsContainer: {
		gap: 10,
		marginBottom: 24,
	},
	statsRow: {
		flexDirection: "row",
		gap: 10,
	},
	statCard: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		padding: 14,
		borderRadius: radii.lg,
		borderWidth: 1,
	},
	statIconContainer: {
		width: 36,
		height: 36,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	statTextContainer: {
		flex: 1,
		marginLeft: 12,
	},
	statValue: {
		fontSize: 22,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		letterSpacing: -0.5,
		lineHeight: 26,
	},
	statTitle: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		letterSpacing: 0.1,
		marginTop: -2,
	},
	statChevron: {
		opacity: 0.5,
	},
	quickAddButton: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 32,
		borderRadius: radii.xl,
	},
	quickAddText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	sectionContainer: {
		marginBottom: 16,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 14,
	},
	sectionTitle: {
		fontSize: 20,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
	},
	viewAllButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	viewAllText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	recentCard: {
		borderRadius: radii.xl,
		borderWidth: 1,
		overflow: "hidden",
	},
	emptyContainer: {
		padding: 32,
		alignItems: "center",
	},
	emptyIcon: {
		width: 64,
		height: 64,
		borderRadius: radii.lg,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 17,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		marginBottom: 6,
	},
	emptyText: {
		fontSize: 15,
		fontFamily: "DMSans",
		textAlign: "center",
		lineHeight: 22,
	},
	savesList: {
		paddingVertical: 4,
	},
	saveItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 14,
		paddingHorizontal: 16,
		gap: 14,
	},
	saveIcon: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	saveContent: {
		flex: 1,
		minWidth: 0,
	},
	saveTitle: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 3,
	},
	saveUrl: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	saveAction: {
		padding: 10,
		marginRight: -6,
	},
});
