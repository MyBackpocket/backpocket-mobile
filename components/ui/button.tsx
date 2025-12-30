/**
 * Button component with Backpocket styling
 */

import type React from "react";
import {
	ActivityIndicator,
	Pressable,
	type PressableProps,
	StyleSheet,
	Text,
	type TextStyle,
	type ViewStyle,
} from "react-native";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

type ButtonVariant =
	| "default"
	| "secondary"
	| "outline"
	| "ghost"
	| "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<PressableProps, "style"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	children: React.ReactNode;
	style?: ViewStyle;
	textStyle?: TextStyle;
}

export function Button({
	variant = "default",
	size = "md",
	loading = false,
	disabled,
	children,
	style,
	textStyle,
	...props
}: ButtonProps) {
	const colors = useThemeColors();

	const getBackgroundColor = (pressed: boolean) => {
		if (disabled) return colors.muted;

		switch (variant) {
			case "default":
				return pressed ? brandColors.rust.deep : colors.primary;
			case "secondary":
				return pressed ? colors.border : colors.secondary;
			case "destructive":
				return pressed ? "#B91C1C" : colors.destructive;
			case "outline":
			case "ghost":
				return pressed ? colors.accent : "transparent";
			default:
				return colors.primary;
		}
	};

	const getTextColor = () => {
		if (disabled) return colors.mutedForeground;

		switch (variant) {
			case "default":
			case "destructive":
				return "#FFFFFF";
			case "secondary":
				return colors.secondaryForeground;
			case "outline":
			case "ghost":
				return colors.foreground;
			default:
				return "#FFFFFF";
		}
	};

	const getBorderColor = () => {
		if (variant === "outline") {
			return colors.border;
		}
		return "transparent";
	};

	const getSizeStyles = (): ViewStyle => {
		switch (size) {
			case "sm":
				return { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 };
			case "lg":
				return { paddingHorizontal: 24, paddingVertical: 14, minHeight: 48 };
			case "icon":
				return {
					width: 40,
					height: 40,
					paddingHorizontal: 0,
					paddingVertical: 0,
				};
			default:
				return { paddingHorizontal: 16, paddingVertical: 10, minHeight: 40 };
		}
	};

	const getTextSize = (): number => {
		switch (size) {
			case "sm":
				return 13;
			case "lg":
				return 16;
			default:
				return 14;
		}
	};

	return (
		<Pressable
			disabled={disabled || loading}
			{...props}
			style={({ pressed }) => [
				styles.button,
				getSizeStyles(),
				{
					backgroundColor: getBackgroundColor(pressed),
					borderColor: getBorderColor(),
					borderWidth: variant === "outline" ? 1 : 0,
					opacity: disabled ? 0.5 : 1,
				},
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator size="small" color={getTextColor()} />
			) : typeof children === "string" ? (
				<Text
					style={[
						styles.text,
						{ color: getTextColor(), fontSize: getTextSize() },
						textStyle,
					]}
				>
					{children}
				</Text>
			) : (
				children
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radii.md,
		gap: 8,
	},
	text: {
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		textAlign: "center",
	},
});
