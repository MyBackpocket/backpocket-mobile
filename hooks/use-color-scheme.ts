import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Hook to get the current color scheme from the device
 * Returns 'light' or 'dark'
 */
export function useColorScheme(): "light" | "dark" {
	const colorScheme = useRNColorScheme();
	return colorScheme === "dark" ? "dark" : "light";
}
