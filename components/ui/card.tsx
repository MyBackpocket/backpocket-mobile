/**
 * Card component with Backpocket styling
 */

import type React from "react";
import {
	StyleSheet,
	Text,
	type TextStyle,
	View,
	type ViewStyle,
} from "react-native";
import { radii, Shadows } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

interface CardProps {
	children: React.ReactNode;
	style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
	const colors = useThemeColors();

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.card, borderColor: colors.border },
				Shadows.md,
				style,
			]}
		>
			{children}
		</View>
	);
}

interface CardHeaderProps {
	children: React.ReactNode;
	style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
	return <View style={[styles.header, style]}>{children}</View>;
}

interface CardTitleProps {
	children: React.ReactNode;
	style?: TextStyle;
}

export function CardTitle({ children, style }: CardTitleProps) {
	const colors = useThemeColors();

	return (
		<Text style={[styles.title, { color: colors.text }, style]}>
			{children}
		</Text>
	);
}

interface CardDescriptionProps {
	children: React.ReactNode;
	style?: TextStyle;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
	const colors = useThemeColors();

	return (
		<Text
			style={[styles.description, { color: colors.mutedForeground }, style]}
		>
			{children}
		</Text>
	);
}

interface CardContentProps {
	children: React.ReactNode;
	style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
	return <View style={[styles.content, style]}>{children}</View>;
}

interface CardFooterProps {
	children: React.ReactNode;
	style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
	return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
	card: {
		borderRadius: radii.lg,
		borderWidth: 1,
		overflow: "hidden",
	},
	header: {
		padding: 16,
		paddingBottom: 8,
	},
	title: {
		fontSize: 18,
		fontFamily: "DMSans-Bold",
		fontWeight: "600",
		lineHeight: 24,
	},
	description: {
		fontSize: 14,
		fontFamily: "DMSans",
		marginTop: 4,
		lineHeight: 20,
	},
	content: {
		padding: 16,
		paddingTop: 0,
	},
	footer: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		paddingTop: 8,
	},
});
