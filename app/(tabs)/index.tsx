import { useUser } from "@clerk/clerk-expo";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
	Bookmark,
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	ExternalLink,
	Eye,
	FolderOpen,
	Globe,
	Link2,
	Plus,
	Star,
	X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Animated,
	Image,
	Modal,
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
import { ProcessingBadge } from "@/components/ui/processing-badge";
import { SwipeableRow } from "@/components/ui/swipeable-row";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import {
	useDeleteSave,
	useToggleArchive,
	useToggleFavorite,
} from "@/lib/api/saves";
import { useDashboard, useListDomains } from "@/lib/api/space";
import type { Save } from "@/lib/api/types";
import { isSaveProcessing } from "@/lib/api/use-processing-saves";
import { buildPublicSpaceHostname, buildPublicSpaceUrl } from "@/lib/constants";
import { useOpenUrl } from "@/lib/utils";

export default function DashboardScreen() {
	const colors = useThemeColors();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { openUrl } = useOpenUrl();

	// Always call useUser hook (React rules of hooks)
	const { user } = useUser();
	const userName = user?.firstName || "there";
	const userImageUrl = user?.imageUrl;

	// Track manual refresh separately from background polling
	const [isManualRefreshing, setIsManualRefreshing] = useState(false);

	// Fetch dashboard data (auto-polls when there are processing saves)
	const { data: dashboard, isLoading, isError, refetch } = useDashboard();

	// Fetch custom domains
	const { data: domains } = useListDomains();

	// Public space data
	const space = dashboard?.space;
	const isPublicEnabled = space?.visibility === "public";
	const publicSpaceUrl = space?.slug ? buildPublicSpaceUrl(space.slug) : "";
	const publicSpaceHostname = space?.slug
		? buildPublicSpaceHostname(space.slug)
		: "";
	const [copied, setCopied] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
	const [showLinksModal, setShowLinksModal] = useState(false);

	// Build list of all space links (default + custom domains)
	const spaceLinks = useMemo(() => {
		const links: { hostname: string; url: string; isPrimary: boolean }[] = [];

		// Add default subdomain
		if (space?.slug) {
			links.push({
				hostname: buildPublicSpaceHostname(space.slug),
				url: buildPublicSpaceUrl(space.slug),
				isPrimary: true,
			});
		}

		// Add active custom domains
		if (domains) {
			for (const domain of domains) {
				if (domain.status === "active" || domain.status === "verified") {
					links.push({
						hostname: domain.domain,
						url: `https://${domain.domain}`,
						isPrimary: false,
					});
				}
			}
		}

		return links;
	}, [space?.slug, domains]);

	const hasMultipleLinks = spaceLinks.length > 1;

	// Animation for public space card
	const [fadeAnim] = useState(() => new Animated.Value(0));
	useEffect(() => {
		if (isPublicEnabled && !isLoading) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}).start();
		}
	}, [isPublicEnabled, isLoading, fadeAnim]);

	const handleCopyUrl = useCallback(async (url: string) => {
		await Clipboard.setStringAsync(url);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopiedUrl(url);
		setTimeout(() => setCopiedUrl(null), 2000);
	}, []);

	const handleCopyPublicUrl = useCallback(async () => {
		if (!publicSpaceUrl) return;
		await Clipboard.setStringAsync(publicSpaceUrl);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [publicSpaceUrl]);

	const handlePreviewPublicSpace = useCallback(() => {
		if (!publicSpaceUrl) return;
		openUrl(publicSpaceUrl);
	}, [publicSpaceUrl, openUrl]);

	const handleOpenSpaceLink = useCallback(
		(url: string) => {
			openUrl(url);
		},
		[openUrl],
	);

	// Filter out archived items from recent saves - they shouldn't appear here
	const recentSaves = (dashboard?.recentSaves || []).filter(
		(save) => !save.isArchived,
	);

	// Manual refresh handler - shows spinner only for user-initiated refreshes
	const handleManualRefresh = useCallback(async () => {
		setIsManualRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsManualRefreshing(false);
		}
	}, [refetch]);

	// Mutations for swipe actions
	const deleteSave = useDeleteSave();
	const toggleArchive = useToggleArchive();
	const toggleFavorite = useToggleFavorite();

	const stats = dashboard?.stats;

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
					refreshing={isManualRefreshing}
					onRefresh={handleManualRefresh}
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
						icon={Star}
						iconColor={brandColors.amber}
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

			{/* Public Space Card - only show when public */}
			{isPublicEnabled && space?.slug && (
				<Animated.View style={{ opacity: fadeAnim }}>
					<View style={styles.publicSpaceCard}>
						<LinearGradient
							colors={[`${brandColors.teal}25`, `${brandColors.mint}15`]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 1 }}
							style={styles.publicSpaceGradient}
						>
							<TouchableOpacity
								style={styles.publicSpaceHeader}
								onPress={
									hasMultipleLinks ? () => setShowLinksModal(true) : undefined
								}
								activeOpacity={hasMultipleLinks ? 0.7 : 1}
							>
								<View
									style={[
										styles.publicSpaceIconContainer,
										{ backgroundColor: `${brandColors.mint}30` },
									]}
								>
									<Globe size={20} color={brandColors.mint} strokeWidth={2} />
								</View>
								<View style={styles.publicSpaceHeaderText}>
									<Text
										style={[styles.publicSpaceTitle, { color: colors.text }]}
									>
										Your Public Space
									</Text>
									<View style={styles.publicSpaceUrlRow}>
										<Text
											style={[
												styles.publicSpaceUrl,
												{ color: brandColors.teal },
											]}
										>
											{publicSpaceHostname}
										</Text>
										{hasMultipleLinks && (
											<View style={styles.multiLinkBadge}>
												<Text
													style={[
														styles.multiLinkBadgeText,
														{ color: colors.mutedForeground },
													]}
												>
													+{spaceLinks.length - 1}
												</Text>
												<ChevronDown size={12} color={colors.mutedForeground} />
											</View>
										)}
									</View>
								</View>
							</TouchableOpacity>

							<View style={styles.publicSpaceStats}>
								<View style={styles.publicSpaceStat}>
									<Eye size={14} color={colors.mutedForeground} />
									<Text
										style={[styles.publicSpaceStatText, { color: colors.text }]}
									>
										{dashboard?.stats?.publicSaves ?? 0}
									</Text>
									<Text
										style={[
											styles.publicSpaceStatLabel,
											{ color: colors.mutedForeground },
										]}
									>
										public saves
									</Text>
								</View>
							</View>

							<View style={styles.publicSpaceActions}>
								<TouchableOpacity
									style={[
										styles.publicSpaceButton,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
										},
									]}
									onPress={handleCopyPublicUrl}
									activeOpacity={0.7}
								>
									{copied ? (
										<Check size={18} color={brandColors.mint} strokeWidth={2} />
									) : (
										<Copy size={18} color={colors.text} strokeWidth={2} />
									)}
									<Text
										style={[
											styles.publicSpaceButtonText,
											{ color: copied ? brandColors.mint : colors.text },
										]}
									>
										{copied ? "Copied!" : "Copy Link"}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.publicSpaceButton,
										styles.publicSpaceButtonPrimary,
										{ backgroundColor: brandColors.teal },
									]}
									onPress={handlePreviewPublicSpace}
									activeOpacity={0.7}
								>
									<ExternalLink size={18} color="#FFFFFF" strokeWidth={2} />
									<Text style={styles.publicSpaceButtonTextPrimary}>
										Preview
									</Text>
									<ChevronRight
										size={16}
										color="#FFFFFF"
										style={{ marginLeft: -4 }}
									/>
								</TouchableOpacity>
							</View>
						</LinearGradient>
					</View>
				</Animated.View>
			)}

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
									onFavorite={() =>
										handleFavoriteSave(save.id, save.isFavorite)
									}
									onOpenUrl={openUrl}
								/>
							))}
						</GestureHandlerRootView>
					)}
				</View>
			</View>

			{/* Space Links Modal */}
			<Modal
				visible={showLinksModal}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setShowLinksModal(false)}
			>
				<View
					style={[
						styles.linksModalContainer,
						{ backgroundColor: colors.background },
					]}
				>
					<View
						style={[
							styles.linksModalHeader,
							{ borderBottomColor: colors.border },
						]}
					>
						<View style={styles.linksModalHeaderSpacer} />
						<Text style={[styles.linksModalTitle, { color: colors.text }]}>
							Space Links
						</Text>
						<TouchableOpacity
							onPress={() => setShowLinksModal(false)}
							style={styles.linksModalClose}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<X size={24} color={colors.text} />
						</TouchableOpacity>
					</View>

					<ScrollView
						style={styles.linksModalContent}
						contentContainerStyle={styles.linksModalContentContainer}
					>
						<Text
							style={[
								styles.linksModalSubtitle,
								{ color: colors.mutedForeground },
							]}
						>
							Your public space is accessible at these URLs
						</Text>

						{spaceLinks.map((link, _index) => {
							const isCopied = copiedUrl === link.url;
							return (
								<View
									key={link.hostname}
									style={[
										styles.linkItem,
										{
											backgroundColor: colors.card,
											borderColor: colors.border,
										},
									]}
								>
									<View style={styles.linkItemHeader}>
										<Link2 size={16} color={colors.mutedForeground} />
										<Text
											style={[styles.linkItemHostname, { color: colors.text }]}
											numberOfLines={1}
										>
											{link.hostname}
										</Text>
										{link.isPrimary && (
											<View
												style={[
													styles.primaryBadge,
													{ backgroundColor: `${brandColors.teal}20` },
												]}
											>
												<Text
													style={[
														styles.primaryBadgeText,
														{ color: brandColors.teal },
													]}
												>
													Primary
												</Text>
											</View>
										)}
									</View>
									<Text
										style={[
											styles.linkItemUrl,
											{ color: colors.mutedForeground },
										]}
										numberOfLines={1}
									>
										{link.url}
									</Text>
									<View style={styles.linkItemActions}>
										<TouchableOpacity
											style={[
												styles.linkItemButtonFull,
												{ backgroundColor: colors.muted },
											]}
											onPress={() => handleCopyUrl(link.url)}
											activeOpacity={0.7}
										>
											{isCopied ? (
												<Check
													size={18}
													color={brandColors.mint}
													strokeWidth={2}
												/>
											) : (
												<Copy size={18} color={colors.text} strokeWidth={2} />
											)}
											<Text
												style={[
													styles.linkItemButtonText,
													{ color: isCopied ? brandColors.mint : colors.text },
												]}
											>
												{isCopied ? "Copied!" : "Copy Link"}
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											style={[
												styles.linkItemButtonFull,
												{ backgroundColor: brandColors.teal },
											]}
											onPress={() => handleOpenSpaceLink(link.url)}
											activeOpacity={0.7}
										>
											<ExternalLink size={18} color="#FFFFFF" strokeWidth={2} />
											<Text style={styles.linkItemButtonTextPrimary}>Open</Text>
										</TouchableOpacity>
									</View>
								</View>
							);
						})}
					</ScrollView>
				</View>
			</Modal>
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
	onOpenUrl: (url: string) => void;
}

function SaveListItem({
	save,
	colors,
	isLast,
	onPress,
	onDelete,
	onArchive,
	onFavorite,
	onOpenUrl,
}: SaveListItemProps) {
	const handleOpenUrl = () => {
		onOpenUrl(save.url);
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
			],
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
				{save.imageUrl ? (
					<Image
						source={{ uri: save.imageUrl }}
						style={styles.saveThumbnail}
						resizeMode="cover"
					/>
				) : (
					<View style={[styles.saveIcon, { backgroundColor: colors.muted }]}>
						<Bookmark size={18} color={colors.mutedForeground} />
					</View>
				)}
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
				{isSaveProcessing(save) && <ProcessingBadge size="sm" />}
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
	publicSpaceCard: {
		marginBottom: 24,
		borderRadius: radii.xl,
		overflow: "hidden",
	},
	publicSpaceGradient: {
		padding: 20,
		borderRadius: radii.xl,
	},
	publicSpaceHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginBottom: 16,
	},
	publicSpaceIconContainer: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	publicSpaceHeaderText: {
		flex: 1,
	},
	publicSpaceTitle: {
		fontSize: 17,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginBottom: 2,
	},
	publicSpaceUrl: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
	},
	publicSpaceUrlRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	multiLinkBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: radii.full,
		backgroundColor: "rgba(0,0,0,0.1)",
	},
	multiLinkBadgeText: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
	},
	publicSpaceStats: {
		flexDirection: "row",
		marginBottom: 16,
	},
	publicSpaceStat: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	publicSpaceStatText: {
		fontSize: 15,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
	},
	publicSpaceStatLabel: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	publicSpaceActions: {
		flexDirection: "row",
		gap: 10,
	},
	publicSpaceButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 12,
		borderRadius: radii.md,
		borderWidth: 1,
	},
	publicSpaceButtonPrimary: {
		borderWidth: 0,
	},
	publicSpaceButtonText: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	publicSpaceButtonTextPrimary: {
		color: "#FFFFFF",
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
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
	saveThumbnail: {
		width: 44,
		height: 44,
		borderRadius: radii.md,
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
	// Links Modal styles
	linksModalContainer: {
		flex: 1,
	},
	linksModalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	linksModalHeaderSpacer: {
		width: 24,
	},
	linksModalTitle: {
		fontSize: 17,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
	linksModalClose: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	linksModalContent: {
		flex: 1,
	},
	linksModalContentContainer: {
		padding: 20,
	},
	linksModalSubtitle: {
		fontSize: 14,
		fontFamily: "DMSans",
		marginBottom: 16,
	},
	linkItem: {
		borderRadius: radii.lg,
		borderWidth: 1,
		padding: 16,
		marginBottom: 12,
	},
	linkItemHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 4,
	},
	linkItemHostname: {
		fontSize: 16,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		flex: 1,
	},
	linkItemUrl: {
		fontSize: 13,
		fontFamily: "DMSans",
		marginLeft: 24,
		marginBottom: 14,
	},
	primaryBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: radii.full,
	},
	primaryBadgeText: {
		fontSize: 11,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	linkItemActions: {
		flexDirection: "row",
		gap: 10,
	},
	linkItemButtonFull: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		height: 48,
		borderRadius: radii.md,
	},
	linkItemButtonText: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	linkItemButtonTextPrimary: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		color: "#FFFFFF",
	},
});
