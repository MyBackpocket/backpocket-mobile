import { Tags } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-color";

export default function TagsScreen() {
	const colors = useThemeColors();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{/* Empty State */}
			<View style={styles.emptyState}>
				<View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
					<Tags size={48} color={colors.mutedForeground} strokeWidth={1.5} />
				</View>
				<Text style={[styles.emptyTitle, { color: colors.text }]}>No tags</Text>
				<Text
					style={[styles.emptyDescription, { color: colors.mutedForeground }]}
				>
					Tags are created when you add them to saves. Add tags to your saves to
					organize and filter them.
				</Text>
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
});
