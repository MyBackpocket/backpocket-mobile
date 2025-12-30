/**
 * Input component with Backpocket styling
 */

import { forwardRef } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
	type ViewStyle,
} from "react-native";
import { radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
	({ label, error, containerStyle, style, ...props }, ref) => {
		const colors = useThemeColors();

		return (
			<View style={containerStyle}>
				{label && (
					<Text style={[styles.label, { color: colors.text }]}>{label}</Text>
				)}
				<TextInput
					ref={ref}
					placeholderTextColor={colors.mutedForeground}
					style={[
						styles.input,
						{
							backgroundColor: colors.background,
							borderColor: error ? colors.destructive : colors.border,
							color: colors.text,
						},
						style,
					]}
					{...props}
				/>
				{error && (
					<Text style={[styles.error, { color: colors.destructive }]}>
						{error}
					</Text>
				)}
			</View>
		);
	},
);

Input.displayName = "Input";

const styles = StyleSheet.create({
	label: {
		fontSize: 14,
		fontFamily: "DMSans-Medium",
		fontWeight: "500",
		marginBottom: 6,
	},
	input: {
		height: 44,
		borderWidth: 1,
		borderRadius: radii.md,
		paddingHorizontal: 12,
		fontSize: 16,
		fontFamily: "DMSans",
	},
	error: {
		fontSize: 12,
		fontFamily: "DMSans",
		marginTop: 4,
	},
});
