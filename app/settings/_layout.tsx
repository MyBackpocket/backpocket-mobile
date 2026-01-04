import { Stack, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-color";

const HEADER_BUTTON_SIZE = 36;

export default function SettingsLayout() {
	const colors = useThemeColors();
	const router = useRouter();

	return (
		<Stack
			screenOptions={{
				headerTintColor: colors.text,
				headerTitleStyle: {
					fontFamily: "DMSans-Bold",
					fontWeight: "600",
				},
				contentStyle: {
					backgroundColor: colors.background,
				},
				headerLeft: () => (
					<TouchableOpacity
						onPress={() => router.back()}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						style={styles.headerButton}
					>
						<ChevronLeft size={24} color={colors.text} />
					</TouchableOpacity>
				),
			}}
		>
			<Stack.Screen
				name="appearance"
				options={{
					title: "Appearance",
				}}
			/>
			<Stack.Screen
				name="profile"
				options={{
					title: "Profile",
				}}
			/>
			<Stack.Screen
				name="notifications"
				options={{
					title: "Notifications",
				}}
			/>
			<Stack.Screen
				name="public-space"
				options={{
					title: "Public Space",
				}}
			/>
		</Stack>
	);
}

const styles = StyleSheet.create({
	headerButton: {
		width: HEADER_BUTTON_SIZE,
		height: HEADER_BUTTON_SIZE,
		borderRadius: HEADER_BUTTON_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
	},
});

