import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { Colors, type ColorsTheme } from "@/constants/theme";
import type { ColorScheme } from "./tokens";

interface ThemeContextValue {
	colorScheme: ColorScheme;
	colors: ColorsTheme;
	isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
	children: React.ReactNode;
	/** Force a specific color scheme, or 'system' to follow device */
	forcedColorScheme?: ColorScheme | "system";
}

export function ThemeProvider({
	children,
	forcedColorScheme = "system",
}: ThemeProviderProps) {
	const systemColorScheme = useSystemColorScheme();

	const colorScheme: ColorScheme = useMemo(() => {
		if (forcedColorScheme === "system") {
			return systemColorScheme === "dark" ? "dark" : "light";
		}
		return forcedColorScheme;
	}, [forcedColorScheme, systemColorScheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			colorScheme,
			colors: colorScheme === "dark" ? Colors.dark : Colors.light,
			isDark: colorScheme === "dark",
		}),
		[colorScheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}

/**
 * Hook to get themed colors based on current color scheme
 */
export function useThemeColors() {
	const { colors } = useTheme();
	return colors;
}

/**
 * Hook to check if dark mode is active
 */
export function useIsDarkMode() {
	const { isDark } = useTheme();
	return isDark;
}
