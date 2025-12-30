/**
 * Backpocket Theme Constants
 * Uses brand tokens from lib/theme/tokens.ts
 */

import { Platform } from "react-native";
import {
	brandColors,
	darkColors,
	fontSizes,
	lightColors,
	radii,
} from "../lib/theme/tokens";

// Re-export for convenience
export { brandColors, lightColors, darkColors, radii, fontSizes };
export type { ColorScheme, Theme } from "../lib/theme/tokens";
export { getColors, theme } from "../lib/theme/tokens";

/**
 * Colors object for React Navigation and components
 * Matches the naming convention expected by navigation/hooks
 */
// Define the shape of a color scheme
interface ColorSchemeColors {
	text: string;
	foreground: string;
	background: string;
	tint: string;
	icon: string;
	tabIconDefault: string;
	tabIconSelected: string;
	card: string;
	cardForeground: string;
	border: string;
	primary: string;
	primaryForeground: string;
	secondary: string;
	secondaryForeground: string;
	muted: string;
	mutedForeground: string;
	accent: string;
	accentForeground: string;
	destructive: string;
	destructiveForeground: string;
	success: string;
	warning: string;
	info: string;
}

export const Colors: { light: ColorSchemeColors; dark: ColorSchemeColors } = {
	light: {
		text: lightColors.foreground,
		foreground: lightColors.foreground,
		background: lightColors.background,
		tint: brandColors.rust.DEFAULT,
		icon: lightColors.mutedForeground,
		tabIconDefault: lightColors.mutedForeground,
		tabIconSelected: brandColors.rust.DEFAULT,
		// Additional semantic colors
		card: lightColors.card,
		cardForeground: lightColors.cardForeground,
		border: lightColors.border,
		primary: lightColors.primary,
		primaryForeground: lightColors.primaryForeground,
		secondary: lightColors.secondary,
		secondaryForeground: lightColors.secondaryForeground,
		muted: lightColors.muted,
		mutedForeground: lightColors.mutedForeground,
		accent: lightColors.accent,
		accentForeground: lightColors.accentForeground,
		destructive: lightColors.destructive,
		destructiveForeground: lightColors.destructiveForeground,
		success: lightColors.success,
		warning: lightColors.warning,
		info: lightColors.info,
	},
	dark: {
		text: darkColors.foreground,
		foreground: darkColors.foreground,
		background: darkColors.background,
		tint: brandColors.amber,
		icon: darkColors.mutedForeground,
		tabIconDefault: darkColors.mutedForeground,
		tabIconSelected: brandColors.amber,
		// Additional semantic colors
		card: darkColors.card,
		cardForeground: darkColors.cardForeground,
		border: darkColors.border,
		primary: darkColors.primary,
		primaryForeground: darkColors.primaryForeground,
		secondary: darkColors.secondary,
		secondaryForeground: darkColors.secondaryForeground,
		muted: darkColors.muted,
		mutedForeground: darkColors.mutedForeground,
		accent: darkColors.accent,
		accentForeground: darkColors.accentForeground,
		destructive: darkColors.destructive,
		destructiveForeground: darkColors.destructiveForeground,
		success: darkColors.success,
		warning: darkColors.warning,
		info: darkColors.info,
	},
};

// Type for a single color scheme
export type ColorsTheme = ColorSchemeColors;

/**
 * Font family configuration
 * Uses system fonts with fallbacks, custom fonts loaded via expo-font
 */
export const Fonts = Platform.select({
	ios: {
		sans: "DMSans",
		sansLight: "DMSans-Light",
		sansMedium: "DMSans-Medium",
		sansBold: "DMSans-Bold",
		serif: "Fraunces",
		serifMedium: "Fraunces-Medium",
		serifBold: "Fraunces-Bold",
		mono: "Menlo",
		// Fallbacks when custom fonts not loaded
		systemSans: "System",
		systemSerif: "Georgia",
	},
	android: {
		sans: "DMSans",
		sansLight: "DMSans-Light",
		sansMedium: "DMSans-Medium",
		sansBold: "DMSans-Bold",
		serif: "Fraunces",
		serifMedium: "Fraunces-Medium",
		serifBold: "Fraunces-Bold",
		mono: "monospace",
		// Fallbacks
		systemSans: "sans-serif",
		systemSerif: "serif",
	},
	default: {
		sans: "DMSans",
		sansLight: "DMSans-Light",
		sansMedium: "DMSans-Medium",
		sansBold: "DMSans-Bold",
		serif: "Fraunces",
		serifMedium: "Fraunces-Medium",
		serifBold: "Fraunces-Bold",
		mono: "monospace",
		systemSans: "system-ui",
		systemSerif: "serif",
	},
	web: {
		sans: "DMSans, 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		sansLight: "DMSans-Light, 'DM Sans', system-ui, sans-serif",
		sansMedium: "DMSans-Medium, 'DM Sans', system-ui, sans-serif",
		sansBold: "DMSans-Bold, 'DM Sans', system-ui, sans-serif",
		serif: "Fraunces, Georgia, 'Times New Roman', serif",
		serifMedium: "Fraunces-Medium, Georgia, serif",
		serifBold: "Fraunces-Bold, Georgia, serif",
		mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
		systemSans: "system-ui, sans-serif",
		systemSerif: "Georgia, serif",
	},
});

/**
 * Common shadow styles (denim-inspired from web)
 */
export const Shadows = {
	sm: Platform.select({
		ios: {
			shadowColor: brandColors.denim.deep,
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.08,
			shadowRadius: 2,
		},
		android: {
			elevation: 1,
		},
		default: {},
	}),
	md: Platform.select({
		ios: {
			shadowColor: brandColors.denim.deep,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
		},
		android: {
			elevation: 3,
		},
		default: {},
	}),
	lg: Platform.select({
		ios: {
			shadowColor: brandColors.denim.deep,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.12,
			shadowRadius: 8,
		},
		android: {
			elevation: 6,
		},
		default: {},
	}),
};

/**
 * Border radii
 */
export const BorderRadius = radii;

/**
 * Typography scale
 */
export const Typography = {
	sizes: fontSizes,
	weights: {
		light: "300" as const,
		normal: "400" as const,
		medium: "500" as const,
		semibold: "600" as const,
		bold: "700" as const,
	},
};
