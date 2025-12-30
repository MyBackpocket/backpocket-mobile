/**
 * Backpocket Logo component
 */

import { Image, StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-color";

interface LogoProps {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	showText?: boolean;
}

const sizeConfig = {
	xs: { dimension: 16, text: 12 },
	sm: { dimension: 24, text: 14 },
	md: { dimension: 32, text: 16 },
	lg: { dimension: 48, text: 20 },
	xl: { dimension: 64, text: 24 },
};

export function Logo({ size = "md", showText = true }: LogoProps) {
	const { dimension, text } = sizeConfig[size];
	const colors = useThemeColors();

	return (
		<View style={styles.container}>
			<Image
				source={require("@/assets/images/icon.png")}
				style={[styles.image, { width: dimension, height: dimension }]}
				resizeMode="contain"
			/>
			{showText && (
				<Text style={[styles.text, { fontSize: text, color: colors.text }]}>
					backpocket
				</Text>
			)}
		</View>
	);
}

export function LogoIcon({ size = "md" }: Omit<LogoProps, "showText">) {
	const { dimension } = sizeConfig[size];

	return (
		<Image
			source={require("@/assets/images/icon.png")}
			style={[styles.image, { width: dimension, height: dimension }]}
			resizeMode="contain"
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	image: {
		borderRadius: 8,
	},
	text: {
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
	},
});
