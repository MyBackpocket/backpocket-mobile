import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import {
	Bookmark,
	FolderOpen,
	LayoutGrid,
	Settings,
	Tags,
} from "lucide-react-native";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors, type ColorsTheme } from "@/constants/theme";
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
	const insets = useSafeAreaInsets();
	
	return (
		<Tabs
			sceneContainerStyle={{
				backgroundColor: colors.background,
			}}
			screenOptions={{
				tabBarActiveTintColor: colors.tint,
				tabBarInactiveTintColor: colors.tabIconDefault,
				tabBarStyle: {
					backgroundColor: colors.card,
					borderTopWidth: 0,
					height: 64 + insets.bottom,
					paddingTop: 8,
					paddingBottom: insets.bottom + 8,
					paddingHorizontal: 8,
					// Subtle top shadow instead of border
					...Platform.select({
						ios: {
							shadowColor: "#000",
							shadowOffset: { width: 0, height: -2 },
							shadowOpacity: 0.06,
							shadowRadius: 8,
						},
						android: {
							elevation: 8,
						},
					}),
				},
				headerStyle: {
					backgroundColor: colors.background,
					borderBottomWidth: 0,
					...Platform.select({
						ios: {
							shadowColor: "transparent",
							shadowOpacity: 0,
						},
						android: {
							elevation: 0,
						},
					}),
				},
				headerTintColor: colors.text,
				headerTitleStyle: {
					fontFamily: "DMSans-Bold",
					fontWeight: "600",
					fontSize: 18,
				},
				tabBarButton: HapticTab,
				tabBarLabelStyle: {
					fontFamily: "DMSans-Medium",
					fontSize: 11,
					marginTop: 2,
				},
				tabBarIconStyle: {
					marginBottom: -2,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, focused }) => (
						<LayoutGrid
							size={22}
							color={focused ? colors.tint : color}
							strokeWidth={focused ? 2.5 : 1.75}
							fill={focused ? colors.tint : "transparent"}
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
							size={22}
							color={focused ? colors.tint : color}
							strokeWidth={focused ? 2.5 : 1.75}
							fill={focused ? colors.tint : "transparent"}
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
							size={22}
							color={focused ? colors.tint : color}
							strokeWidth={focused ? 2.5 : 1.75}
							fill={focused ? colors.tint : "transparent"}
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
							size={22}
							color={focused ? colors.tint : color}
							strokeWidth={focused ? 2.5 : 1.75}
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
							size={22}
							color={focused ? colors.tint : color}
							strokeWidth={focused ? 2.5 : 1.75}
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
