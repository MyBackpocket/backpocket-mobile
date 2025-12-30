/**
 * Lucide Icon wrapper for Backpocket
 * Uses lucide-react-native for consistent icons with the web app
 */

import type { LucideIcon } from "lucide-react-native";
import { useThemeColors } from "@/hooks/use-theme-color";

export interface IconProps {
	icon: LucideIcon;
	size?: number;
	color?: string;
	strokeWidth?: number;
	className?: string;
}

export function Icon({
	icon: LucideIcon,
	size = 24,
	color,
	strokeWidth = 2,
}: IconProps) {
	const colors = useThemeColors();
	const iconColor = color ?? colors.foreground;

	return <LucideIcon size={size} color={iconColor} strokeWidth={strokeWidth} />;
}

// Common icon sizes
export const IconSizes = {
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 28,
	"2xl": 32,
} as const;
