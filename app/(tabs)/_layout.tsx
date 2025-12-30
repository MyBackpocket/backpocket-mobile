import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import {
	Bookmark,
	FolderOpen,
	LayoutDashboard,
	Settings,
	Tags,
} from "lucide-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { brandColors, Colors, type ColorsTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";

/**
 * Tab layout with Clerk auth protection
 * Redirects to sign-in if user is not authenticated
 */
export default function TabLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme];

	// Use Clerk auth hook - must be called unconditionally
	// When Clerk is not configured, these will be undefined
	// biome-ignore lint/correctness/useHookAtTopLevel: Conditional hook based on Clerk config is intentional
	const auth = CLERK_PUBLISHABLE_KEY ? useAuth() : null;
	const isSignedIn = auth?.isSignedIn;
	const isLoaded = auth?.isLoaded ?? true;

	// If Clerk is not configured, show tabs without auth (development mode)
	if (!CLERK_PUBLISHABLE_KEY) {
		return <TabsNavigator colors={colors} />;
	}

	// Show loading spinner while checking auth
	if (!isLoaded) {
		return (
			<View style={[styles.loading, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.tint} />
			</View>
		);
	}

	// Redirect to sign-in if not authenticated
	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />;
	}

	return <TabsNavigator colors={colors} />;
}

interface TabsNavigatorProps {
	colors: ColorsTheme;
}

function TabsNavigator({ colors }: TabsNavigatorProps) {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.tint,
				tabBarInactiveTintColor: colors.tabIconDefault,
				tabBarStyle: {
					backgroundColor: colors.card,
					borderTopColor: colors.border,
				},
				headerStyle: {
					backgroundColor: colors.card,
				},
				headerTintColor: colors.text,
				headerTitleStyle: {
					fontFamily: "DMSans-Bold",
					fontWeight: "600",
				},
				tabBarButton: HapticTab,
				tabBarLabelStyle: {
					fontFamily: "DMSans-Medium",
					fontSize: 11,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, focused }) => (
						<LayoutDashboard
							size={24}
							color={focused ? brandColors.rust.DEFAULT : color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="saves"
				options={{
					title: "Saves",
					tabBarIcon: ({ color, focused }) => (
						<Bookmark
							size={24}
							color={focused ? brandColors.rust.DEFAULT : color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="collections"
				options={{
					title: "Collections",
					tabBarIcon: ({ color, focused }) => (
						<FolderOpen
							size={24}
							color={focused ? brandColors.rust.DEFAULT : color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="tags"
				options={{
					title: "Tags",
					tabBarIcon: ({ color, focused }) => (
						<Tags
							size={24}
							color={focused ? brandColors.rust.DEFAULT : color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color, focused }) => (
						<Settings
							size={24}
							color={focused ? brandColors.rust.DEFAULT : color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
