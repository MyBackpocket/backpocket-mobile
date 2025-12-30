import { useUser } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Bookmark, ExternalLink, Plus } from "lucide-react-native";
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useDashboard } from "@/lib/api/space";
import type { Save } from "@/lib/api/types";

export default function DashboardScreen() {
	const colors = useThemeColors();
	const router = useRouter();

	// Always call useUser hook (React rules of hooks)
	const { user } = useUser();
	const userName = user?.firstName || "there";

	// Fetch dashboard data
	const {
		data: dashboard,
		isLoading,
		isError,
		refetch,
		isRefetching,
	} = useDashboard();

	const stats = dashboard?.stats;
	const recentSaves = dashboard?.recentSaves || [];

	return (
		<ScrollView
			style={[styles.container, { backgroundColor: colors.background }]}
			contentContainerStyle={styles.content}
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
				<Logo size="md" showText={false} />
				<View style={styles.greeting}>
					<Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
						Welcome back,
					</Text>
					<Text style={[styles.userName, { color: colors.text }]}>
						{userName}
					</Text>
				</View>
			</View>

			{/* Stats Cards */}
			<View style={styles.statsGrid}>
				<StatCard
					title="Total Saves"
					value={isLoading ? "--" : String(stats?.totalSaves ?? 0)}
					subtitle="saved links"
					colors={colors}
				/>
				<StatCard
					title="Favorites"
					value={isLoading ? "--" : String(stats?.favoriteSaves ?? 0)}
					subtitle="marked favorite"
					colors={colors}
				/>
				<StatCard
					title="Public"
					value={isLoading ? "--" : String(stats?.publicSaves ?? 0)}
					subtitle="publicly visible"
					colors={colors}
				/>
				<StatCard
					title="Collections"
					value={isLoading ? "--" : String(stats?.totalCollections ?? 0)}
					subtitle="organized groups"
					colors={colors}
				/>
			</View>

			{/* Quick Actions */}
			<View style={styles.quickActions}>
				<Button
					onPress={() => router.push("/save/new")}
					style={styles.quickAddButton}
				>
					<Plus size={20} color="#FFFFFF" />
					<Text style={styles.quickAddText}>Add Save</Text>
				</Button>
			</View>

			{/* Recent Saves */}
			<Card style={styles.recentCard}>
				<CardHeader style={styles.recentHeader}>
					<CardTitle>Recent Saves</CardTitle>
					{recentSaves.length > 0 && (
						<TouchableOpacity onPress={() => router.push("/(tabs)/saves")}>
							<Text
								style={[
									styles.viewAllLink,
									{ color: brandColors.rust.DEFAULT },
								]}
							>
								View all
							</Text>
						</TouchableOpacity>
					)}
				</CardHeader>
				<CardContent>
					{isLoading && (
						<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
							Loading...
						</Text>
					)}

					{isError && (
						<Text style={[styles.emptyText, { color: colors.destructive }]}>
							Failed to load saves
						</Text>
					)}

					{!isLoading && !isError && recentSaves.length === 0 && (
						<>
							<Text
								style={[styles.emptyText, { color: colors.mutedForeground }]}
							>
								Your recently saved links will appear here.
							</Text>
							<Text
								style={[styles.emptyHint, { color: colors.mutedForeground }]}
							>
								Share a link to Backpocket to get started!
							</Text>
						</>
					)}

					{!isLoading && recentSaves.length > 0 && (
						<View style={styles.savesList}>
							{recentSaves.slice(0, 5).map((save) => (
								<SaveListItem
									key={save.id}
									save={save}
									colors={colors}
									onPress={() => router.push(`/save/${save.id}`)}
								/>
							))}
						</View>
					)}
				</CardContent>
			</Card>
		</ScrollView>
	);
}

interface StatCardProps {
	title: string;
	value: string;
	subtitle: string;
	colors: ReturnType<typeof useThemeColors>;
}

function StatCard({ title, value, subtitle, colors }: StatCardProps) {
	return (
		<Card style={styles.statCard}>
			<CardContent style={styles.statContent}>
				<Text style={[styles.statTitle, { color: colors.mutedForeground }]}>
					{title}
				</Text>
				<Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
				<Text style={[styles.statSubtitle, { color: colors.mutedForeground }]}>
					{subtitle}
				</Text>
			</CardContent>
		</Card>
	);
}

interface SaveListItemProps {
	save: Save;
	colors: ReturnType<typeof useThemeColors>;
	onPress: () => void;
}

function SaveListItem({ save, colors, onPress }: SaveListItemProps) {
	const handleOpenUrl = () => {
		Linking.openURL(save.url);
	};

	return (
		<TouchableOpacity
			style={[styles.saveItem, { borderBottomColor: colors.border }]}
			onPress={onPress}
			activeOpacity={0.7}
		>
			<View style={[styles.saveIcon, { backgroundColor: colors.muted }]}>
				<Bookmark size={16} color={colors.mutedForeground} />
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
			<TouchableOpacity onPress={handleOpenUrl} style={styles.saveAction}>
				<ExternalLink size={18} color={colors.mutedForeground} />
			</TouchableOpacity>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 24,
		paddingTop: 8,
	},
	greeting: {
		flex: 1,
	},
	welcomeText: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	userName: {
		fontSize: 20,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginBottom: 20,
	},
	statCard: {
		width: "48%",
		flexGrow: 1,
		minWidth: 150,
	},
	statContent: {
		padding: 16,
		alignItems: "center",
	},
	statTitle: {
		fontSize: 11,
		fontFamily: "DMSans-Medium",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	statValue: {
		fontSize: 28,
		fontFamily: "DMSans-Bold",
		fontWeight: "700",
		marginVertical: 4,
	},
	statSubtitle: {
		fontSize: 11,
		fontFamily: "DMSans",
	},
	quickActions: {
		marginBottom: 20,
	},
	quickAddButton: {
		flexDirection: "row",
		gap: 8,
	},
	quickAddText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	recentCard: {
		marginBottom: 16,
	},
	recentHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	viewAllLink: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	emptyText: {
		fontSize: 15,
		fontFamily: "DMSans",
		textAlign: "center",
		marginBottom: 8,
	},
	emptyHint: {
		fontSize: 13,
		fontFamily: "DMSans",
		textAlign: "center",
		fontStyle: "italic",
	},
	savesList: {
		gap: 0,
	},
	saveItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	saveIcon: {
		width: 36,
		height: 36,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	saveContent: {
		flex: 1,
		minWidth: 0,
	},
	saveTitle: {
		fontSize: 15,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 2,
	},
	saveUrl: {
		fontSize: 13,
		fontFamily: "DMSans",
	},
	saveAction: {
		padding: 8,
	},
});
