import { FolderOpen, Plus } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/hooks/use-theme-color";

export default function CollectionsScreen() {
	const colors = useThemeColors();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Empty State */}
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
				<Button style={styles.addButton}>
					<Plus size={20} color="#FFFFFF" />
					<Text style={styles.addButtonText}>Create Collection</Text>
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
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
});
