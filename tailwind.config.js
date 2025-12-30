/** @type {import('tailwindcss').Config} */
module.exports = {
	// NativeWind v4 uses CSS-based approach
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			// Backpocket Brand Colors (matching web globals.css)
			colors: {
				// Brand palette
				denim: {
					DEFAULT: "#5B7A8A",
					deep: "#3D5A6C",
					faded: "#8EACBD",
				},
				rust: {
					DEFAULT: "#C96D3B",
					deep: "#9E3F2C",
				},
				amber: "#E8B86D",
				mint: "#9DC08B",
				teal: "#7FBFBF",
				cream: "#F5F0E6",
				parchment: "#E8DFD0",
				charcoal: "#3A3A3A",

				// Semantic colors (light mode defaults, dark mode via class)
				background: "var(--background)",
				foreground: "var(--foreground)",
				card: {
					DEFAULT: "var(--card)",
					foreground: "var(--card-foreground)",
				},
				popover: {
					DEFAULT: "var(--popover)",
					foreground: "var(--popover-foreground)",
				},
				primary: {
					DEFAULT: "var(--primary)",
					foreground: "var(--primary-foreground)",
				},
				secondary: {
					DEFAULT: "var(--secondary)",
					foreground: "var(--secondary-foreground)",
				},
				muted: {
					DEFAULT: "var(--muted)",
					foreground: "var(--muted-foreground)",
				},
				accent: {
					DEFAULT: "var(--accent)",
					foreground: "var(--accent-foreground)",
				},
				destructive: {
					DEFAULT: "var(--destructive)",
					foreground: "var(--destructive-foreground)",
				},
				border: "var(--border)",
				input: "var(--input)",
				ring: "var(--ring)",
				success: "var(--success)",
				warning: "var(--warning)",
				info: "var(--info)",
			},
			borderRadius: {
				sm: "8px",
				DEFAULT: "12px",
				md: "12px",
				lg: "16px",
				xl: "20px",
			},
			fontFamily: {
				sans: ["DMSans", "system-ui", "sans-serif"],
				"sans-light": ["DMSans-Light", "system-ui", "sans-serif"],
				"sans-medium": ["DMSans-Medium", "system-ui", "sans-serif"],
				"sans-bold": ["DMSans-Bold", "system-ui", "sans-serif"],
				serif: ["Fraunces", "Georgia", "serif"],
				"serif-medium": ["Fraunces-Medium", "Georgia", "serif"],
				"serif-bold": ["Fraunces-Bold", "Georgia", "serif"],
			},
			fontSize: {
				xs: ["12px", { lineHeight: "16px" }],
				sm: ["14px", { lineHeight: "20px" }],
				base: ["16px", { lineHeight: "24px" }],
				lg: ["18px", { lineHeight: "28px" }],
				xl: ["20px", { lineHeight: "28px" }],
				"2xl": ["24px", { lineHeight: "32px" }],
				"3xl": ["30px", { lineHeight: "36px" }],
				"4xl": ["36px", { lineHeight: "40px" }],
				"5xl": ["48px", { lineHeight: "1" }],
			},
		},
	},
	plugins: [],
};
