import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

// NativeWind styles
import "../global.css";

// Custom fonts
import {
	DMSans_300Light,
	DMSans_400Regular,
	DMSans_500Medium,
	DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
	Fraunces_400Regular,
	Fraunces_500Medium,
	Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";

import { Providers } from "@/components/providers";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
	anchor: "(tabs)",
};

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme];
	const [appIsReady, setAppIsReady] = useState(false);

	const [fontsLoaded, fontError] = useFonts({
		// DM Sans
		"DMSans-Light": DMSans_300Light,
		DMSans: DMSans_400Regular,
		"DMSans-Medium": DMSans_500Medium,
		"DMSans-Bold": DMSans_700Bold,
		// Fraunces
		Fraunces: Fraunces_400Regular,
		"Fraunces-Medium": Fraunces_500Medium,
		"Fraunces-Bold": Fraunces_700Bold,
	});

	useEffect(() => {
		async function prepare() {
			if (fontsLoaded || fontError) {
				await SplashScreen.hideAsync();
				setAppIsReady(true);
			}
		}
		prepare();
	}, [fontsLoaded, fontError]);

	if (!appIsReady) {
		return null;
	}

	return (
		<Providers>
			<Stack
				screenOptions={{
					contentStyle: {
						backgroundColor: colors.background,
					},
				}}
			>
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="save/[id]" options={{ headerShown: true }} />
				<Stack.Screen name="save/new" options={{ headerShown: true }} />
				<Stack.Screen name="collection/new" options={{ headerShown: true }} />
				<Stack.Screen name="settings" options={{ headerShown: false }} />
				<Stack.Screen
					name="share"
					options={{ headerShown: false, presentation: "modal" }}
				/>
			</Stack>
			<StatusBar style="auto" />
		</Providers>
	);
}
