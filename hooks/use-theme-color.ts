/**
 * Hook to get a specific color value from the current theme
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

type ColorKey = keyof typeof Colors.light;

export function useThemeColor(colorKey: ColorKey): string {
	const colorScheme = useColorScheme();
	return Colors[colorScheme][colorKey];
}

/**
 * Get all colors for current theme
 */
export function useThemeColors() {
	const colorScheme = useColorScheme();
	return Colors[colorScheme];
}
