/**
 * Processing Badge Component
 *
 * Shows an animated "Processing" indicator for saves that are
 * still being processed by the backend.
 */

import { Loader2 } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { brandColors, radii } from "@/constants/theme";

interface ProcessingBadgeProps {
	/**
	 * Size variant for the badge
	 * - "sm": Compact for list items
	 * - "md": Standard for cards
	 */
	size?: "sm" | "md";
}

export function ProcessingBadge({ size = "sm" }: ProcessingBadgeProps) {
	const spinAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const animation = Animated.loop(
			Animated.timing(spinAnim, {
				toValue: 1,
				duration: 1000,
				easing: Easing.linear,
				useNativeDriver: true,
			}),
		);
		animation.start();

		return () => animation.stop();
	}, [spinAnim]);

	const spin = spinAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"],
	});

	const isSmall = size === "sm";

	return (
		<View
			style={[
				styles.container,
				isSmall ? styles.containerSm : styles.containerMd,
			]}
		>
			<Animated.View style={{ transform: [{ rotate: spin }] }}>
				<Loader2
					size={isSmall ? 10 : 12}
					color={brandColors.amber}
					strokeWidth={2.5}
				/>
			</Animated.View>
			<Text style={[styles.text, isSmall ? styles.textSm : styles.textMd]}>
				Processing
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: `${brandColors.amber}20`,
		borderRadius: radii.full,
		gap: 4,
	},
	containerSm: {
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	containerMd: {
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	text: {
		color: brandColors.amber,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
	},
	textSm: {
		fontSize: 11,
	},
	textMd: {
		fontSize: 12,
	},
});

