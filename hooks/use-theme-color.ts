/**
 * Hook to get a specific color value from the current theme
 * Uses ThemeProvider context which respects user's theme preference
 */

import { Colors } from "@/constants/theme";
import { useTheme } from "@/lib/theme/provider";

type ColorKey = keyof typeof Colors.light;

export function useThemeColor(colorKey: ColorKey): string {
	const { colorScheme } = useTheme();
	return Colors[colorScheme][colorKey];
}

/**
 * Get all colors for current theme
 */
export function useThemeColors() {
	const { colors } = useTheme();
	return colors;
}
