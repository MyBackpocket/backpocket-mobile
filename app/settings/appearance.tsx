import { Check, Moon, Smartphone, Sun } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { type ThemePreference, useSettings } from "@/lib/settings";

const THEME_OPTIONS: {
	value: ThemePreference;
	label: string;
	description: string;
	icon: typeof Sun;
}[] = [
	{
		value: "system",
		label: "System",
		description: "Match your device settings",
		icon: Smartphone,
	},
	{
		value: "light",
		label: "Light",
		description: "Always use light mode",
		icon: Sun,
	},
	{
		value: "dark",
		label: "Dark",
		description: "Always use dark mode",
		icon: Moon,
	},
];

export default function AppearanceSettingsScreen() {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();
	const { settings, setTheme } = useSettings();

	const handleSelectTheme = async (theme: ThemePreference) => {
		await setTheme(theme);
	};

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
					paddingBottom: insets.bottom + 16,
				},
			]}
		>
			<View style={styles.content}>
				<Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
					Theme
				</Text>
				<Card style={styles.card}>
					{THEME_OPTIONS.map((option, index) => {
						const Icon = option.icon;
						const isSelected = settings.theme === option.value;
						const isLast = index === THEME_OPTIONS.length - 1;

						return (
							<TouchableOpacity
								key={option.value}
								style={[
									styles.option,
									!isLast && { borderBottomColor: colors.border },
									!isLast && styles.optionBorder,
								]}
								onPress={() => handleSelectTheme(option.value)}
								activeOpacity={0.7}
							>
								<View
									style={[styles.iconContainer, { backgroundColor: colors.muted }]}
								>
									<Icon size={20} color={colors.mutedForeground} strokeWidth={2} />
								</View>
								<View style={styles.optionContent}>
									<Text style={[styles.optionLabel, { color: colors.text }]}>
										{option.label}
									</Text>
									<Text
										style={[
											styles.optionDescription,
											{ color: colors.mutedForeground },
										]}
									>
										{option.description}
									</Text>
								</View>
								{isSelected && (
									<Check size={22} color={colors.primary} strokeWidth={2.5} />
								)}
							</TouchableOpacity>
						);
					})}
				</Card>

				<Text style={[styles.helpText, { color: colors.mutedForeground }]}>
					Choose how Backpocket appears on your device. System follows your
					device's appearance settings.
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 8,
		marginLeft: 4,
	},
	card: {
		marginBottom: 12,
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		gap: 14,
	},
	optionBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: radii.md,
		alignItems: "center",
		justifyContent: "center",
	},
	optionContent: {
		flex: 1,
	},
	optionLabel: {
		fontSize: 16,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 2,
	},
	optionDescription: {
		fontSize: 14,
		fontFamily: "DMSans",
	},
	helpText: {
		fontSize: 13,
		fontFamily: "DMSans",
		lineHeight: 20,
		marginLeft: 4,
	},
});

