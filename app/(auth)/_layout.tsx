import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Auth layout - redirects to main app if already signed in
 */
export default function AuthLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme];
	const { isSignedIn, isLoaded } = useAuth();

	// Show nothing while loading auth state
	if (!isLoaded) {
		return null;
	}

	// Redirect to main app if already signed in
	if (isSignedIn) {
		return <Redirect href="/(tabs)" />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: {
					backgroundColor: colors.background,
				},
			}}
		>
			<Stack.Screen name="sign-in" />
			<Stack.Screen name="sign-up" />
		</Stack>
	);
}
