/**
 * Backpocket Brand Design Tokens
 * Ported from web app globals.css - exact same palette for carbon copy UI
 */

// === Brand Colors (hex conversions from HSL) ===
export const brandColors = {
	// Primary Denim Blues
	denim: {
		DEFAULT: "#5B7A8A", // hsl(200, 21%, 45%)
		deep: "#3D5A6C", // hsl(203, 28%, 33%)
		faded: "#8EACBD", // hsl(202, 28%, 65%)
	},

	// Accent Colors
	rust: {
		DEFAULT: "#C96D3B", // hsl(21, 58%, 51%)
		deep: "#9E3F2C", // hsl(21, 56%, 40%)
	},
	amber: "#E8B86D", // hsl(37, 72%, 67%)
	mint: "#9DC08B", // hsl(100, 30%, 65%)
	teal: "#7FBFBF", // hsl(180, 33%, 62%)

	// Neutrals
	cream: "#F5F0E6", // hsl(40, 43%, 93%)
	parchment: "#E8DFD0", // hsl(38, 37%, 86%)
	charcoal: "#3A3A3A", // hsl(0, 0%, 23%)
} as const;

// === Light Mode Semantic Colors ===
export const lightColors = {
	background: brandColors.cream,
	foreground: brandColors.charcoal,

	card: "#F7F4ED", // hsl(40, 38%, 96%)
	cardForeground: brandColors.charcoal,

	popover: "#F7F4ED",
	popoverForeground: brandColors.charcoal,

	primary: brandColors.rust.DEFAULT,
	primaryForeground: "#FAF9F7", // hsl(40, 43%, 97%)

	secondary: "#E8EEF1", // hsl(202, 25%, 92%)
	secondaryForeground: brandColors.denim.deep,

	muted: brandColors.parchment,
	mutedForeground: "#5C7080", // hsl(200, 15%, 40%)

	accent: "#E5EDF1", // hsl(202, 22%, 90%)
	accentForeground: brandColors.denim.deep,

	destructive: "#EF4444", // hsl(0, 84%, 60%)
	destructiveForeground: "#FFFFFF",

	border: "#D9D0C3", // hsl(38, 25%, 82%)
	input: "#D9D0C3",
	ring: brandColors.rust.DEFAULT,

	// Semantic
	success: brandColors.mint,
	warning: brandColors.amber,
	info: brandColors.teal,
} as const;

// === Dark Mode Semantic Colors ===
export const darkColors = {
	background: "#141D22", // hsl(203, 30%, 10%)
	foreground: "#EAE5DC", // hsl(40, 30%, 90%)

	card: "#1A252C", // hsl(203, 28%, 12%)
	cardForeground: "#EAE5DC",

	popover: "#1A252C",
	popoverForeground: "#EAE5DC",

	primary: brandColors.amber, // Amber for CTAs in dark mode
	primaryForeground: "#141D22",

	secondary: "#243038", // hsl(203, 20%, 18%)
	secondaryForeground: "#DDD7CC", // hsl(40, 25%, 85%)

	muted: "#20292F", // hsl(203, 18%, 16%)
	mutedForeground: "#7A8B96", // hsl(200, 15%, 55%)

	accent: "#283640", // hsl(203, 22%, 20%)
	accentForeground: "#EBE6DD", // hsl(40, 25%, 90%)

	destructive: "#DC2626", // hsl(0, 72%, 50%)
	destructiveForeground: "#FFFFFF",

	border: "#283640", // hsl(203, 18%, 20%)
	input: "#283640",
	ring: brandColors.amber,

	// Semantic
	success: brandColors.mint,
	warning: brandColors.amber,
	info: brandColors.teal,
} as const;

// === Radii ===
export const radii = {
	sm: 8, // 0.5rem = 8px
	md: 12, // 0.75rem = 12px (--radius)
	lg: 16, // 1rem = 16px
	xl: 20, // 1.25rem = 20px
	full: 9999,
} as const;

// === Spacing (4px grid) ===
export const spacing = {
	0: 0,
	0.5: 2,
	1: 4,
	1.5: 6,
	2: 8,
	2.5: 10,
	3: 12,
	3.5: 14,
	4: 16,
	5: 20,
	6: 24,
	7: 28,
	8: 32,
	9: 36,
	10: 40,
	11: 44,
	12: 48,
	14: 56,
	16: 64,
	20: 80,
	24: 96,
	28: 112,
	32: 128,
	36: 144,
	40: 160,
	44: 176,
	48: 192,
	52: 208,
	56: 224,
	60: 240,
	64: 256,
	72: 288,
	80: 320,
	96: 384,
} as const;

// === Font Families ===
// Will be loaded via expo-font
export const fontFamilies = {
	sans: "DMSans",
	sansLight: "DMSans-Light",
	sansMedium: "DMSans-Medium",
	sansBold: "DMSans-Bold",
	serif: "Fraunces",
	serifMedium: "Fraunces-Medium",
	serifBold: "Fraunces-Bold",
} as const;

// === Font Sizes ===
export const fontSizes = {
	xs: 12,
	sm: 14,
	base: 16,
	lg: 18,
	xl: 20,
	"2xl": 24,
	"3xl": 30,
	"4xl": 36,
	"5xl": 48,
} as const;

// === Line Heights ===
export const lineHeights = {
	tight: 1.25,
	snug: 1.375,
	normal: 1.5,
	relaxed: 1.625,
	loose: 2,
} as const;

// === Export combined theme object ===
export const theme = {
	brand: brandColors,
	light: lightColors,
	dark: darkColors,
	radii,
	spacing,
	fonts: fontFamilies,
	fontSizes,
	lineHeights,
} as const;

export type Theme = typeof theme;
export type ColorScheme = "light" | "dark";

/**
 * Get colors for current color scheme
 */
export function getColors(colorScheme: ColorScheme) {
	return colorScheme === "dark" ? darkColors : lightColors;
}
